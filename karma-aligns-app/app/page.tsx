export default function Page() {
  // Server component that renders the client landing
  // If you prefer client-only, use dynamic import with { ssr: false }.
  // import dynamic from "next/dynamic";
  // const AstroLanding = dynamic(() => import("@/components/landing/AstroLanding"), { ssr: false });
  // return <AstroLanding />;
  const AstroLanding = require("@/components/landing/AstroLanding").default;
  return <AstroLanding />;
}