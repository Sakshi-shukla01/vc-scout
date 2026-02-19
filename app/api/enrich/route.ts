import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

function stripHtml(html: string) {
  // basic HTML -> text (fast MVP)
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/?[^>]+(>|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function guessSignals(text: string) {
  const t = text.toLowerCase();
  const signals: string[] = [];
  if (t.includes("careers") || t.includes("jobs")) signals.push("Careers page or hiring mentions detected");
  if (t.includes("blog") || t.includes("news")) signals.push("Content updates (blog/news) mentioned");
  if (t.includes("docs") || t.includes("documentation")) signals.push("Docs/documentation mentioned");
  if (signals.length === 0) signals.push("Public website accessible");
  return signals.slice(0, 4);
}

export async function POST(req: Request) {
  try {
    const { website } = (await req.json()) as { website?: string };

    if (!website) return new NextResponse("Missing website", { status: 400 });

    const scrapedAt = new Date().toISOString();

    // 1) Fetch homepage (MVP)
    const resp = await fetch(website, {
      headers: { "User-Agent": "Mozilla/5.0 (VC-Scout Enricher)" },
    });

    if (!resp.ok) {
      return new NextResponse(`Failed to fetch website: ${resp.status}`, { status: 400 });
    }

    const html = await resp.text();
    const text = stripHtml(html).slice(0, 12000); // keep within token limits

    // 2) AI extract fields (Gemini)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return new NextResponse("Missing GEMINI_API_KEY", { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });



    const prompt = `
You are an analyst assistant. Extract structured company info from website text.
Return ONLY valid JSON with exactly these keys:
{
  "summary": string (1-2 sentences),
  "whatTheyDo": string[] (3-6 bullets),
  "keywords": string[] (5-10 keywords),
  "derivedSignals": string[] (2-4 inferred signals)
}
Website text:
"""${text}"""
`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    // 3) Parse JSON safely (Gemini may wrap with ```json)
    const cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // fallback: if JSON parse fails
      parsed = {
        summary: "Could not parse AI response. Showing fallback summary.",
        whatTheyDo: ["Extracted data from public website content."],
        keywords: ["website", "public-data", "enrichment"],
        derivedSignals: guessSignals(text),
      };
    }

    // 4) Ensure required keys exist
    const payload = {
      summary: parsed.summary ?? "No summary available",
      whatTheyDo: Array.isArray(parsed.whatTheyDo) ? parsed.whatTheyDo : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      derivedSignals: Array.isArray(parsed.derivedSignals)
        ? parsed.derivedSignals
        : guessSignals(text),
      sources: [{ url: website, scrapedAt }],
    };

    return NextResponse.json(payload);
  } catch (e: any) {
    return new NextResponse(e?.message ?? "Server error", { status: 500 });
  }
}
