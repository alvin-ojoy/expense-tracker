"use client"

import { useState, Suspense } from "react"
import dynamic from 'next/dynamic'

const DashboardOverview = dynamic(() => import("@/components/dashboard-charts-enhanced").then(mod => ({ default: mod.DashboardOverview })), {
  loading: () => (
    <div className="space-y-4">
      <div className="h-[300px] bg-muted rounded-lg animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-[250px] bg-muted rounded-lg animate-pulse" />
        <div className="h-[250px] bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  ),
  ssr: false
})

const BudgetDisplay = dynamic(() => import("@/components/budget-display").then(mod => ({ default: mod.BudgetDisplay })), {
  loading: () => <div className="h-[200px] bg-muted rounded-lg animate-pulse" />,
  ssr: false
})

const DashboardAddExpense = dynamic(() => import("@/components/dashboard-add-expense").then(mod => ({ default: mod.DashboardAddExpense })), {
  loading: () => <div className="h-[200px] bg-muted rounded-lg animate-pulse" />,
  ssr: false
})

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleExpenseAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleBudgetUpdated = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your expense tracker</p>
        </div>
      </div>
      
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Suspense fallback={<div className="h-[200px] bg-muted rounded-lg animate-pulse" />}>
            <BudgetDisplay refreshKey={refreshKey} onBudgetUpdated={handleBudgetUpdated} />
          </Suspense>
          <div className="space-y-6">
            <Suspense fallback={<div className="h-[200px] bg-muted rounded-lg animate-pulse" />}>
              <DashboardAddExpense onSuccess={handleExpenseAdded} />
            </Suspense>
          </div>
        </div>
        <Suspense fallback={
          <div className="space-y-4">
            <div className="h-[300px] bg-muted rounded-lg animate-pulse" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-[250px] bg-muted rounded-lg animate-pulse" />
              <div className="h-[250px] bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        }>
          <DashboardOverview refreshKey={refreshKey} />
        </Suspense>
      </div>
    </div>
  )
}