import { LazyMotion, domAnimation, m } from "framer-motion";

const items = [
  { title: "Birth Chart Visualization", emoji: "📜" },
  { title: "Planetary Positions", emoji: "🌌" },
  { title: "Karmic Insights", emoji: "🔮" },
  { title: "Personalized Reading", emoji: "🪐" },
];

export default function ValueGrid() {
  return (
    <LazyMotion features={domAnimation}>
      <section id="value" className="mx-auto max-w-6xl px-6 py-12">
        <div className="card glow p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((i, idx) => (
              <m.div
                key={i.title}
                className="p-5 relative"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20% 0px" }}
                transition={{ delay: idx * 0.06, duration: 0.45 }}
              >
                <div className="text-2xl">{i.emoji}</div>
                <h3 className="mt-3 font-semibold">{i.title}</h3>
                <p className="mt-2 text-sm text-white/75">
                  A brief one-liner about what this gives the user.
                </p>

                {/* subtle divider lines between cells */}
                <div className="divider absolute right-0 top-4 bottom-4 hidden lg:block" />
              </m.div>
            ))}
          </div>
        </div>
      </section>
    </LazyMotion>
  );
}
