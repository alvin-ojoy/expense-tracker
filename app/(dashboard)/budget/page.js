"use client"

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Skeleton } from "@/components/ui/skeleton"

const BudgetDashboard = dynamic(() => import("@/components/budget-dashboard").then(mod => ({ default: mod.BudgetDashboard })), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-[200px] w-full" />
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-[250px] w-full" />
    </div>
  )
})

export default function BudgetPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground">
            Track your spending against monthly budgets
          </p>
        </div>
      </div>
      <Suspense fallback={
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[250px] w-full" />
        </div>
      }>
        <BudgetDashboard />
      </Suspense>
    </div>
  )
}