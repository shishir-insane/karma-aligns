// app/natal/page.tsx
import PageTransition from "@/components/layout/page-transition"
import NatalTabs from "@/components/composed/natal-tabs"

export default function NatalPage() {
  return (
    <PageTransition>
      <NatalTabs />
    </PageTransition>
  )
}
