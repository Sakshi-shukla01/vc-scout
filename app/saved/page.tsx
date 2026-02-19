"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getSavedSearches, saveSavedSearches, type SavedSearch } from "@/lib/storage";
import { useRouter } from "next/navigation";

export default function SavedPage() {
  const [items, setItems] = useState<SavedSearch[]>([]);
  const router = useRouter();

  useEffect(() => {
    setItems(getSavedSearches());
  }, []);

  const remove = (id: string) => {
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    saveSavedSearches(next);
  };

  const copyLink = async (queryString: string) => {
    const url = `${window.location.origin}/companies${queryString || ""}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied!");
    } catch {
      prompt("Copy this link:", url);
    }
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">Saved Searches</h1>
        <p className="text-sm text-muted-foreground">
          Re-run saved filters instantly. Stored in localStorage.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="font-medium">Saved</div>
          <div className="text-xs text-muted-foreground">
            Tip: Save searches from the Companies page and share as a link.
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <div className="rounded-md border p-6 text-sm text-muted-foreground">
              No saved searches yet. Go to <b>Companies</b>, apply filters, then click <b>Save search</b>.
            </div>
          ) : (
            items.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm">{s.name}</div>
                  <div className="text-xs text-muted-foreground break-all">
                    {s.queryString || "(no filters)"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => router.push(`/companies${s.queryString || ""}`)}>
                    Run
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copyLink(s.queryString || "")}>
                    Copy link
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => remove(s.id)}>
                    Remove
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
