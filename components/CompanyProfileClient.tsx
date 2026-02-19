"use client";

import type { Company, EnrichmentResult } from "@/lib/types";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  getEnrichCache,
  getNote,
  setEnrichCache,
  setNote,
  getLists,
  saveLists,
  type VCList,
} from "@/lib/storage";

export default function CompanyProfileClient({ company }: { company: Company }) {
  const [note, setNoteState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enriched, setEnriched] = useState<EnrichmentResult | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const [lists, setListsState] = useState<VCList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>("");

  useEffect(() => {
    setNoteState(getNote(company.id));
    const cache = getEnrichCache(company.id);
    if (cache) {
      setEnriched(cache.result);
      setCachedAt(cache.cachedAt);
    }
  }, [company.id]);

  useEffect(() => {
    setListsState(getLists());
  }, []);

  const onSaveNote = () => {
    setNote(company.id, note);
  };

  const addToList = () => {
    if (!selectedListId) return;
    const next = lists.map((l) => {
      if (l.id !== selectedListId) return l;
      if (l.companyIds.includes(company.id)) return l;
      return { ...l, companyIds: [company.id, ...l.companyIds] };
    });
    setListsState(next);
    saveLists(next);
  };

  const removeFromList = () => {
    if (!selectedListId) return;
    const next = lists.map((l) => {
      if (l.id !== selectedListId) return l;
      return { ...l, companyIds: l.companyIds.filter((id) => id !== company.id) };
    });
    setListsState(next);
    saveLists(next);
  };

  const onEnrich = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id, website: company.website }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Enrichment failed (${res.status})`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const txt = await res.text();
        throw new Error(`Expected JSON but got: ${txt.slice(0, 120)}`);
      }

      const data = (await res.json()) as EnrichmentResult;

      setEnriched(data);

      const now = new Date().toISOString();
      setCachedAt(now);
      setEnrichCache(company.id, data);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onClear = () => {
    setEnriched(null);
    setCachedAt(null);
    setError(null);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">{company.name}</h1>
        <div className="flex flex-wrap gap-2 mt-2 items-center">
          <Badge variant="secondary">{company.industry}</Badge>
          <Badge variant="outline">{company.stage}</Badge>
          <Badge variant="outline">{company.location}</Badge>
          <a
            className="text-sm underline text-muted-foreground"
            href={company.website}
            target="_blank"
            rel="noreferrer"
          >
            {company.website}
          </a>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{company.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="font-medium">Notes & Actions</div>
            <div className="text-xs text-muted-foreground">
              Notes, lists and enrichment cache are stored in localStorage
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Lists</div>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={selectedListId}
                onChange={(e) => setSelectedListId(e.target.value)}
              >
                <option value="">Select list...</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <Button variant="outline" onClick={addToList} disabled={!selectedListId}>
                  Add
                </Button>
                <Button variant="outline" onClick={removeFromList} disabled={!selectedListId}>
                  Remove
                </Button>
              </div>

              {lists.length === 0 && (
                <div className="text-xs text-muted-foreground">
                  No lists yet. Create one in <b>Lists</b> page.
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <Textarea
                value={note}
                onChange={(e) => setNoteState(e.target.value)}
                placeholder="Write your thesis-fit notes..."
                rows={7}
              />
              <Button onClick={onSaveNote} variant="outline">
                Save note
              </Button>
            </div>

            <div className="pt-2 border-t space-y-2">
              <div className="flex gap-2">
                <Button onClick={onEnrich} disabled={loading}>
                  {loading ? "Enriching..." : enriched ? "Re-enrich" : "Enrich (Live)"}
                </Button>

                {cachedAt && (
                  <Button variant="outline" disabled={loading} onClick={onClear}>
                    Clear
                  </Button>
                )}
              </div>

              {cachedAt && (
                <div className="text-xs text-muted-foreground">
                  Cached: {new Date(cachedAt).toLocaleString()}
                </div>
              )}

              {error && <div className="text-xs text-red-600">{error}</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="font-medium">Enrichment</div>
            <div className="text-xs text-muted-foreground">
              Summary, bullets, keywords and signals extracted from public web pages
            </div>
          </CardHeader>

          <CardContent>
            {!enriched ? (
              <div className="text-sm text-muted-foreground">
                Click <b>Enrich</b> to fetch public website content and extract fields.
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium">Summary</div>
                  <p className="text-sm text-muted-foreground mt-1">{enriched.summary}</p>
                </div>

                <div>
                  <div className="text-sm font-medium">What they do</div>
                  <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                    {enriched.whatTheyDo.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="text-sm font-medium">Keywords</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {enriched.keywords.map((k, idx) => (
                      <Badge key={idx} variant="secondary">
                        {k}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium">Derived signals</div>
                  <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                    {enriched.derivedSignals.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t">
                  <div className="text-sm font-medium">Sources</div>
                  <div className="mt-2 space-y-1 text-sm">
                    {enriched.sources.map((src, idx) => (
                      <div key={idx} className="text-muted-foreground">
                        <a className="underline" href={src.url} target="_blank" rel="noreferrer">
                          {src.url}
                        </a>{" "}
                        <span className="text-xs">
                          • {new Date(src.scrapedAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
