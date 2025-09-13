import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const raw = await req.json();

    const payload: any = { ...raw };
    if (payload.date && !payload.dob) payload.dob = payload.date;
    if (payload.time && !payload.tob) payload.tob = payload.time;
    if (payload.lat != null) payload.lat = Number(payload.lat);
    if (payload.lon != null) payload.lon = Number(payload.lon);
    delete payload.date; delete payload.time;

    const upstreamUrl = process.env.COMPUTE_API_URL;

    if (!upstreamUrl) {
      if (process.env.NODE_ENV !== "production") {
        const mock = await import("../../data/compute.json").then((m) => m.default);
        return NextResponse.json(mock);
      }
      return NextResponse.json({ error: "COMPUTE_API_URL is not set" }, { status: 500 });
    }

    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    const data = (() => { try { return JSON.parse(text); } catch { return text; } })();

    if (!upstream.ok) {
      const message =
        typeof data === "string"
          ? data
          : data?.error?.message || data?.detail || `Upstream failed (${upstream.status})`;
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected error in /api/v1/compute" },
      { status: 500 }
    );
  }
}
