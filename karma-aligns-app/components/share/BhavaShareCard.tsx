"use client";
import * as React from "react";

export default function BhavaShareCard({
  topText,
  subText,
  logoText = "KA",
}: {
  topText: string;
  subText: string;
  logoText?: string;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const c = canvasRef.current!;
    const dpr = Math.max(2, window.devicePixelRatio || 1);
    const W = 1080, H = 1920; // Story size
    c.width = W * dpr; c.height = H * dpr; c.style.width = `${W}px`; c.style.height = `${H}px`;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // BG gradient
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "rgba(139,92,246,0.85)"); // violet-500
    g.addColorStop(1, "rgba(236,72,153,0.75)"); // fuchsia/rose
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Frosted panel
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    roundRect(ctx, 80, 360, W - 160, 780, 32); ctx.fill();

    // Headline
    ctx.fillStyle = "white";
    ctx.font = "700 72px Inter, system-ui, sans-serif";
    ctx.fillText(topText, 100, 520);

    // Subline (wrap)
    ctx.font = "400 56px Inter, system-ui, sans-serif";
    wrap(ctx, subText, 100, 620, W - 200, 66);

    // Logo
    ctx.fillStyle = "rgba(255,255,255,.92)";
    ctx.font = "700 44px Inter, system-ui, sans-serif";
    ctx.fillText(logoText, W - 140, H - 80);
  }, [topText, subText, logoText]);

  const download = () => {
    const url = canvasRef.current!.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = "bhavabala-share.png"; a.click();
  };

  return (
    <div className="ka-card p-4 ka-card-hover">
      <canvas ref={canvasRef} />
      <button onClick={download} className="mt-3 text-xs rounded-xl border border-white/10 px-3 py-1.5 hover:bg-white/5">
        Save image
      </button>
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(" ");
  let line = "", yy = y;
  for (const w of words) {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxW) { ctx.fillText(line, x, yy); line = w + " "; yy += lh; }
    else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}
