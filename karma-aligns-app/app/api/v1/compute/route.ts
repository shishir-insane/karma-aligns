// app/api/v1/compute/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const upstreamUrl = process.env.COMPUTE_API_URL;

    if (!upstreamUrl) {
      if (process.env.NODE_ENV !== "production") {
        // dynamically import mock only in dev; avoids resolver errors if file is absent
        const mock = await import("@/components/data/compute.json").then(m => m.default);
        return NextResponse.json(mock);
      }
      return NextResponse.json(
        { error: "COMPUTE_API_URL is not set on the server." },
        { status: 500 }
      );
    }

    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return NextResponse.json(
        { error: text || `Upstream failed (${upstream.status})` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error in /api/v1/compute" },
      { status: 500 }
    );
  }
}
