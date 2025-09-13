import Image from "next/image";
import { scrollToId } from "../utils/scroll";

export default function PreviewSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
      {/* Left: larger chart with soft hover */}
      <div className="relative ka-fade-up" style={{ ['--ka-delay' as any]: '0ms' }}>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-xl">
          <div className="relative rounded-xl overflow-hidden group">
            <Image
              src="/sample-chart.png"      // replace later with your real preview
              alt="Sample birth chart"
              width={900}
              height={900}
              className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02] select-none"
              priority={false}
            />

            {/* soft ring when hovering */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            >
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full ring-4 ring-white/30" />
            </div>
          </div>
        </div>
      </div>

      {/* Right: copy + CTA */}
      <div className="ka-fade-up" style={{ ['--ka-delay' as any]: '150ms' }}>
        <h3 className="text-xl font-bold">Why this matters</h3>
        <ul className="mt-4 space-y-2 text-white/80">
          <li>• Visualize your birth chart instantly.</li>
          <li>• Understand planetary influences.</li>
          <li>• Gain actionable karmic insights.</li>
        </ul>

        <div className="mt-6">
          <button
            onClick={(e) => { e.preventDefault(); scrollToId("birth-form"); }}
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3 font-semibold text-white
             bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-lg hover:shadow-xl
             transition-transform duration-300 hover:scale-[1.03] active:scale-95"
          >
            See My Cosmic Blueprint
          </button>
        </div>
      </div>
    </section>
  );
}
