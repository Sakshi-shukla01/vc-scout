"use client";

import companiesSeed from "@/lib/data/companies.seed.json";
import type { Company } from "@/lib/types";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getSavedSearches,
  saveSavedSearches,
  type SavedSearch,
  getCustomCompanies,
  saveCustomCompanies,
} from "@/lib/storage";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PAGE_SIZE = 10;

const slugify = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function CompaniesPage() {
  const seed = companiesSeed as Company[];
  const router = useRouter();
  const searchParams = useSearchParams();

  // custom companies from localStorage
  const [custom, setCustom] = useState<Company[]>([]);

  useEffect(() => {
    setCustom(getCustomCompanies() as Company[]);
  }, []);

const companies = useMemo(() => {
  const safeCustom = (custom || []).filter(
    (c) => c && typeof c.id === "string" && typeof c.name === "string"
  );
  return [...safeCustom, ...seed];
}, [custom, seed]);

  // ---- Read initial values from URL ----
  const initialQ = searchParams.get("q") ?? "";
  const initialIndustry = searchParams.get("industry") ?? "All";
  const initialStage = searchParams.get("stage") ?? "All";
  const initialPage = Number(searchParams.get("page") ?? "1") || 1;

  const [q, setQ] = useState(initialQ);
  const [industry, setIndustry] = useState(initialIndustry);
  const [stage, setStage] = useState(initialStage);
  const [page, setPage] = useState(initialPage);

  // ---- Add company dialog state ----
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [newIndustry, setNewIndustry] = useState("AI");
  const [newStage, setNewStage] = useState("Seed");
  const [newLocation, setNewLocation] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const industries = useMemo(() => {
    const set = new Set(companies.map((c) => c.industry));
    return ["All", ...Array.from(set)];
  }, [companies]);

  const stages = useMemo(() => {
    const set = new Set(companies.map((c) => c.stage));
    return ["All", ...Array.from(set)];
  }, [companies]);

  // ---- Filter ----
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return companies.filter((c) => {
      const matchesQuery =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.website.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query);

      const matchesIndustry = industry === "All" || c.industry === industry;
      const matchesStage = stage === "All" || c.stage === stage;

      return matchesQuery && matchesIndustry && matchesStage;
    });
  }, [companies, q, industry, stage]);

  // reset to page 1 on any filter change
  useEffect(() => {
    setPage(1);
  }, [q, industry, stage]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const current = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ---- Sync URL with state ----
  useEffect(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (industry !== "All") params.set("industry", industry);
    if (stage !== "All") params.set("stage", stage);
    if (safePage !== 1) params.set("page", String(safePage));

    const qs = params.toString();
    router.replace(qs ? `/companies?${qs}` : "/companies");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, industry, stage, safePage]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (industry !== "All") params.set("industry", industry);
    if (stage !== "All") params.set("stage", stage);
    if (safePage !== 1) params.set("page", String(safePage));
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [q, industry, stage, safePage]);

  const onSaveSearch = () => {
    const name = `Search: ${q.trim() || "All"} • ${industry} • ${stage}`;
    const item: SavedSearch = { id: crypto.randomUUID(), name, queryString: queryString || "" };
    const existing = getSavedSearches();
    const next = [item, ...existing].slice(0, 25);
    saveSavedSearches(next);
    alert("Saved search!");
  };

  const onShareLink = async () => {
    const url = `${window.location.origin}/companies${queryString}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    } catch {
      prompt("Copy this link:", url);
    }
  };

  const onAddCompany = () => {
    const name = newName.trim();
    const website = newWebsite.trim();

    if (!name) return alert("Name is required");
    if (!website || !(website.startsWith("http://") || website.startsWith("https://"))) {
      return alert("Website must start with https://");
    }

    const id = slugify(name) || crypto.randomUUID();

    const newCompany: Company = {
      id,
      name,
      website,
      industry: newIndustry.trim() || "AI",
      stage: newStage.trim() || "Seed",
      location: newLocation.trim() || "Unknown",
      description: newDesc.trim() || "Added by user.",
    };

    const next = [newCompany, ...custom];
    setCustom(next);
    saveCustomCompanies(next);

    // reset form
    setNewName("");
    setNewWebsite("");
    setNewIndustry("AI");
    setNewStage("Seed");
    setNewLocation("");
    setNewDesc("");
    setOpen(false);

    alert("Company added!");
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Companies</h1>
          <p className="text-sm text-muted-foreground">
            Discover companies with fast search + filters. Open a profile to enrich from public sources.
          </p>
        </div>

        {/* ✅ Add Company */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Add Company</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a company</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Company name (e.g., Google)" />
              <Input value={newWebsite} onChange={(e) => setNewWebsite(e.target.value)} placeholder="Website (https://...)" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} placeholder="Industry (e.g., AI)" />
                <Input value={newStage} onChange={(e) => setNewStage(e.target.value)} placeholder="Stage (e.g., Seed)" />
              </div>
              <Input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="Location (e.g., Bengaluru, India)" />
              <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={4} placeholder="Short description..." />

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={onAddCompany}>Add</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3 space-y-3">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, site, description..."
              />
            </div>

            <div className="flex gap-2">
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                {industries.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>

              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                {stages.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onShareLink}>
              Share link
            </Button>
            <Button onClick={onSaveSearch}>Save search</Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-3">Company</th>
                  <th className="p-3">Industry</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Location</th>
                </tr>
              </thead>

              <tbody>
                {current.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <Link className="font-medium hover:underline" href={`/companies/${c.id}`}>
                        {c.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{c.description}</div>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary">{c.industry}</Badge>
                    </td>
                    <td className="p-3">{c.stage}</td>
                    <td className="p-3">{c.location}</td>
                  </tr>
                ))}

                {current.length === 0 && (
                  <tr>
                    <td className="p-6 text-muted-foreground" colSpan={4}>
                      No results. Try removing filters or clearing the search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-muted-foreground">
              {filtered.length} results • page {safePage} of {totalPages}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
