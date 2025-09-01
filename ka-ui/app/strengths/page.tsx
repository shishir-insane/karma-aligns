// app/strengths/page.tsx
import PageTransition from "@/components/layout/page-transition"
import StrengthsGrid from "@/components/composed/strengths-grid"

export default function StrengthsPage() {
  return (
    <PageTransition>
      <StrengthsGrid />
    </PageTransition>
  )
}
