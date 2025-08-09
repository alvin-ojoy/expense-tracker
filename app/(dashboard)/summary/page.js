"use client"

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from "@/components/ui/skeleton"

const SummaryCharts = dynamic(() => import("@/components/summary-charts").then(mod => ({ default: mod.SummaryCharts })), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
})

export default function SummaryPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Monthly Summary</h1>
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      }>
        <SummaryCharts />
      </Suspense>
    </div>
  )
}