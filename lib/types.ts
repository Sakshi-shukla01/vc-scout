export type Company = {
  id: string;
  name: string;
  website: string;
  industry: string;
  stage: string;
  location: string;
  description: string;
};

export type EnrichmentResult = {
  summary: string;
  whatTheyDo: string[];
  keywords: string[];
  derivedSignals: string[];
  sources: { url: string; scrapedAt: string }[];
};
