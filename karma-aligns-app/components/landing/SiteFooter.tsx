import { H3, Small, Caption } from "@/components/ui/Type";

export default function SiteFooter() {
  return (
    <footer className="relative mt-20 px-6 py-12">
      {/* subtle constellation background */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{ backgroundImage: "url('/art/constellation-grid.svg')", backgroundRepeat: "no-repeat", backgroundSize: "cover" }}
      />

      <div className="relative mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 ka-fade-up" style={{ ['--ka-delay' as any]: '0ms' }}>
        <div>
        <H3 className="md:text-2xl font-bold drop-shadow-[0_0_12px_rgba(255,255,255,.15)]">karma aligns</H3>
        <Small>Balance your karma, align your life.</Small>
        <Caption>© 2025 Karma Aligns. All rights reserved.</Caption>
        </div>

        <nav className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-semibold mb-2">Product</div>
            <ul className="space-y-2">
              <li><a className="hover:underline" href="#value">Features</a></li>
              <li><a className="hover:underline" href="#">Pricing</a></li>
              <li><a className="hover:underline" href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Company</div>
            <ul className="space-y-2">
              <li><a className="hover:underline" href="#">About</a></li>
              <li><a className="hover:underline" href="#">Careers</a></li>
              <li><a className="hover:underline" href="#">Press</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Legal</div>
            <ul className="space-y-2">
              <li><a className="hover:underline" href="#">Privacy</a></li>
              <li><a className="hover:underline" href="#">Terms</a></li>
              <li><a className="hover:underline" href="#">Contact</a></li>
            </ul>
          </div>
        </nav>

        <div className="md:text-right">
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3 font-semibold text-white
                       bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-lg hover:shadow-xl
                       transition-transform duration-300 hover:scale-[1.03] active:scale-95"
          >
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  );
}
