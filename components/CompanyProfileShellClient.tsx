"use client";

import { useEffect, useMemo, useState } from "react";
import companiesSeed from "@/lib/data/companies.seed.json";
import type { Company } from "@/lib/types";
import { getCustomCompanies } from "@/lib/storage";
import CompanyProfileClient from "@/components/CompanyProfileClient";

export default function CompanyProfileShellClient({
  companyId,
}: {
  companyId: string;
}) {
  const seed = companiesSeed as Company[];
  const [custom, setCustom] = useState<Company[]>([]);

  useEffect(() => {
    setCustom(getCustomCompanies() as Company[]);
  }, []);

  const company = useMemo(() => {
    return [...custom, ...seed].find((c) => c.id === companyId);
  }, [custom, seed, companyId]);

  if (!company) {
    return (
      <div className="text-sm text-muted-foreground max-w-6xl mx-auto">
        Company not found. Go back to Companies.
      </div>
    );
  }

  return <CompanyProfileClient company={company} />;
}
