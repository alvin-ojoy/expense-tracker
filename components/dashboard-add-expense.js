"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExpenseForm } from "@/components/expense-form"

export function DashboardAddExpense({ onSuccess }) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
    
    // Force refresh of expense list if on expenses page
    if (window.location.pathname === '/expenses') {
      window.location.reload()
    }
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Quick Add Expense</h3>
          <p className="text-sm text-muted-foreground">
            Add a new expense quickly
          </p>
        </div>
        <ExpenseForm onSuccess={handleSuccess} />
      </div>
      <div className="text-sm text-muted-foreground">
        Use the button above to quickly add your daily expenses
      </div>
    </div>
  )
}