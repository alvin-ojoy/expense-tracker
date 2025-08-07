"use client"

import { useState } from "react"
import { DashboardOverview } from "@/components/summary-charts"
import { DashboardAddExpense } from "@/components/dashboard-add-expense"

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleExpenseAdded = () => {
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
        <DashboardAddExpense onSuccess={handleExpenseAdded} />
        <DashboardOverview refreshKey={refreshKey} />
      </div>
    </div>
  )
}