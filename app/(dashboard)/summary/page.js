import { SummaryCharts } from "@/components/summary-charts"

export default function SummaryPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Monthly Summary</h1>
      <SummaryCharts />
    </div>
  )
}