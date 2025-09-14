'use client';
import React, {useMemo, useState} from 'react';

type Any = any;

function isObj(v: Any) { return v && typeof v === 'object' && !Array.isArray(v); }
function isArr(v: Any) { return Array.isArray(v); }

function KeyLabel({k}:{k:string}) {
  return <span className="font-mono text-xs text-white/70">{k}</span>;
}
function Badge({children}:{children:React.ReactNode}) {
  return <span className="ml-2 rounded-full bg-white/10 border border-white/15 text-[10px] px-2 py-0.5 text-white/70">{children}</span>;
}

function Node({
  k, v, depth, collapsedByDefault, query
}: { k?: string; v: Any; depth: number; collapsedByDefault: boolean; query: string }) {
  const [open, setOpen] = useState(!collapsedByDefault);
  const match = (txt: string) => !query || txt.toLowerCase().includes(query);

  if (v === null || typeof v !== 'object') {
    const valStr = typeof v === 'string' ? `"${v}"` : String(v);
    if (k && query && !(match(k) || match(valStr))) return null;
    return (
      <div className="pl-3 py-1">
        {k && <KeyLabel k={k} />} <span className="text-white/80">{valStr}</span>
      </div>
    );
  }

  // array
  if (isArr(v)) {
    const items = v as Any[];
    const header = (
      <div className="flex items-center justify-between">
        <div className="truncate">
          {k && <KeyLabel k={k} />} <Badge>{items.length} item{items.length===1?'':'s'}</Badge>
        </div>
        <button onClick={()=>setOpen(o=>!o)} className="text-xs text-white/60 hover:text-white/90">{open?'Collapse':'Expand'}</button>
      </div>
    );
    if (query && k && !match(k) && !items.some(it => JSON.stringify(it).toLowerCase().includes(query))) return null;

    return (
      <div className="pl-3 py-1">
        {header}
        {open && (
          <div className="mt-1 border-l border-white/10">
            {items.map((it, i)=>(
              <Node key={i} v={it} depth={depth+1} collapsedByDefault={depth>1} query={query} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // object
  const obj = v as Record<string, Any>;
  const keys = Object.keys(obj);
  const header = (
    <div className="flex items-center justify-between">
      <div className="truncate">
        {k && <KeyLabel k={k} />} <Badge>{keys.length} key{keys.length===1?'':'s'}</Badge>
      </div>
      <button onClick={()=>setOpen(o=>!o)} className="text-xs text-white/60 hover:text-white/90">{open?'Collapse':'Expand'}</button>
    </div>
  );

  if (query) {
    const hay = (k??'') + ' ' + JSON.stringify(obj);
    if (!hay.toLowerCase().includes(query)) return null;
  }

  return (
    <div className="pl-3 py-1">
      {header}
      {open && (
        <div className="mt-1 border-l border-white/10">
          {keys.map((ck)=>(
            <Node key={ck} k={ck} v={obj[ck]} depth={depth+1} collapsedByDefault={depth>1} query={query} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function JsonExplorer({
  data, collapsed = true
}: { data: Any; collapsed?: boolean }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const pretty = useMemo(()=>JSON.stringify(data ?? {}, null, 2), [data]);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(pretty); } catch {}
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="Search keys & values…"
          className="w-full sm:max-w-xs rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-fuchsia-300/70"
        />
        <div className="flex gap-2">
          <button onClick={()=>setQ('')} className="text-xs rounded-lg px-3 py-2 bg-white/5 border border-white/10 hover:bg-white/8">Clear</button>
          <button onClick={handleCopy} className="text-xs rounded-lg px-3 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-[0_8px_30px_rgba(168,85,247,.30)]">Copy JSON</button>
        </div>
      </div>

      <div className="mt-3 max-h-[60vh] overflow-auto pr-2">
        <Node v={data ?? {}} depth={0} collapsedByDefault={collapsed} query={query} />
      </div>
    </div>
  );
}
