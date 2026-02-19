"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/companies", label: "Companies" },
  { href: "/lists", label: "Lists" },
  { href: "/saved", label: "Saved" }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r bg-background">
      <div className="p-4">
        <div className="text-sm font-semibold tracking-tight">VC Scout</div>
        <div className="text-xs text-muted-foreground mt-1">
          Thesis-first discovery
        </div>
      </div>

      <nav className="px-2 pb-4">
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm hover:bg-accent",
                active && "bg-accent font-medium"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 text-xs text-muted-foreground">
        Demo build • localStorage
      </div>
    </aside>
  );
}
