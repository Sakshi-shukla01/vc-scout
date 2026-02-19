"use client";

import { Input } from "@/components/ui/input";

export default function Topbar() {
  return (
    <div className="flex items-center gap-3 border-b bg-background px-4 py-3">
      <div className="font-medium text-sm hidden sm:block">Discovery</div>
      <div className="flex-1">
        <Input placeholder="Global search (UI only for now)..." />
      </div>
    </div>
  );
}
