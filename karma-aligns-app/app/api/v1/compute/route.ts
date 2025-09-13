export async function POST(req: Request) {
    const payload = await req.json();
    // forward to your real compute service
    const upstream = await fetch(process.env.COMPUTE_API_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      // If your backend is external and you need cookies, add: credentials:'include'
    });
  
    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(JSON.stringify({ error: text || 'Upstream failed' }), { status: upstream.status });
    }
  
    const data = await upstream.json();
    return Response.json(data);
  }
  