import { LazyMotion, domAnimation, m } from "framer-motion";
import { H3, Small } from "@/components/ui/Type";

const items = [
  { title: "Birth Chart Visualization", emoji: "📜", desc: "See Your Soul's Map - A visual guide that reveals your hidden strengths, challenges, and life purpose at a glance." },
  { title: "Planetary Positions", emoji: "🌌", desc: "Decode Your Cosmic Influences - Understand how planetary energies shape your personality, relationships, and destiny." },
  { title: "Karmic Insights", emoji: "🔮", desc: "Break Free from Limiting Patterns - Discover your karmic lessons and how to transform obstacles into opportunities." },
  { title: "Personalized Reading", emoji: "🪐", desc: "Your Personal Life Manual - Get specific guidance tailored to your unique cosmic signature and current life phase." },
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
                <H3>{i.title}</H3>
                <Small>
                  {i.desc}
                </Small>

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
