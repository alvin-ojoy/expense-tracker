"use client"

import { useState, useEffect } from "react"
import { ExpenseTable } from "@/components/expense-table"
import { ExpenseForm } from "@/components/expense-form"
import { ExpenseAnalytics } from "@/components/expense-analytics"
import { createClient } from "@/lib/supabase/client"

export default function ExpensesPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const supabase = createClient()

  const handleExpenseAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track and manage your daily expenses</p>
        </div>
        <ExpenseForm onSuccess={handleExpenseAdded} />
      </div>
      
      <div className="space-y-8">
        <ExpenseAnalytics refreshKey={refreshKey} />
        <ExpenseTable refreshKey={refreshKey} onExpenseChange={handleExpenseAdded} />
      </div>
    </div>
  )
}