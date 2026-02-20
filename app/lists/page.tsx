"use client";

import { useEffect, useMemo, useState } from "react";
import companiesSeed from "@/lib/data/companies.seed.json";
import type { Company } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getLists,
  saveLists,
  type VCList,
  getCustomCompanies,
} from "@/lib/storage";

export default function ListsPage() {
  const seed = companiesSeed as Company[];

  // ✅ load custom companies from localStorage
  const [custom, setCustom] = useState<Company[]>([]);
  useEffect(() => {
    const c = (getCustomCompanies() as Company[]) || [];
    setCustom(
      c.filter(
        (x) =>
          x &&
          typeof x.id === "string" &&
          typeof x.name === "string" &&
          typeof x.website === "string"
      )
    );
  }, []);

  // ✅ merged companies used for exports
  const companies = useMemo(() => {
    return [...custom, ...seed];
  }, [custom, seed]);

  // ✅ fast lookup by id
  const companyById = useMemo(() => {
    const map = new Map<string, Company>();
    for (const c of companies) map.set(c.id, c);
    return map;
  }, [companies]);

  const [lists, setListsState] = useState<VCList[]>([]);
  const [name, setName] = useState("");

  const loadLists = () => {
    setListsState(getLists());
  };

  useEffect(() => {
    loadLists();

    // optional: keep in sync if other tab changes localStorage
    const onStorage = (e: StorageEvent) => {
      if (e.key === "vc_lists") loadLists();
      if (e.key === "vc_custom_companies") {
        const c = (getCustomCompanies() as Company[]) || [];
        setCustom(
          c.filter(
            (x) =>
              x &&
              typeof x.id === "string" &&
              typeof x.name === "string" &&
              typeof x.website === "string"
          )
        );
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createList = () => {
    const n = name.trim();
    if (!n) return;
    const newList: VCList = { id: crypto.randomUUID(), name: n, companyIds: [] };
    const next = [newList, ...lists];
    setListsState(next);
    saveLists(next);
    setName("");
  };

  const removeList = (id: string) => {
    const next = lists.filter((l) => l.id !== id);
    setListsState(next);
    saveLists(next);
  };

  const exportJSON = (list: VCList) => {
    const rows = list.companyIds
      .map((cid) => companyById.get(cid))
      .filter(Boolean) as Company[];

    const missing = list.companyIds.filter((cid) => !companyById.get(cid));

    const payload = {
      ...list,
      companies: rows,
      exportedAt: new Date().toISOString(),
      missingCompanyIds: missing, // helps debug if anything not found
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${list.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = (list: VCList) => {
    const rows = list.companyIds
      .map((cid) => companyById.get(cid))
      .filter(Boolean) as Company[];

    const header = ["id", "name", "website", "industry", "stage", "location"];

    const lines = [
      header.join(","),
      ...rows.map((c) =>
        [c.id, c.name, c.website, c.industry, c.stage, c.location]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${list.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">Lists</h1>
        <p className="text-sm text-muted-foreground">
          Create lists, add/remove companies from a company profile, and export lists (CSV/JSON).
        </p>

        {/* ✅ Debug indicator (keeps you sane on Vercel) */}
        <div className="text-xs text-muted-foreground mt-1">
          Custom companies loaded: {custom.length}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New list name..."
            />
            <Button onClick={createList}>Create</Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {lists.length === 0 ? (
            <div className="text-sm text-muted-foreground">No lists yet.</div>
          ) : (
            lists.map((l) => (
              <div
                key={l.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border p-3"
              >
                <div>
                  <div className="font-medium text-sm">{l.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.companyIds.length} companies
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportCSV(l)}
                  >
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportJSON(l)}
                  >
                    Export JSON
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeList(l.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}