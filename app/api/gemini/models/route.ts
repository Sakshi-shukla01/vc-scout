import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return new NextResponse("Missing GEMINI_API_KEY", { status: 500 });

  // List models available to THIS API key
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const resp = await fetch(url);

  const text = await resp.text();
  // return raw text so you can see the exact model names if JSON parsing fails
  return new NextResponse(text, {
    status: resp.status,
    headers: { "content-type": resp.headers.get("content-type") ?? "text/plain" },
  });
}
