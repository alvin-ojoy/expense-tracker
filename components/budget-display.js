"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp } from "lucide-react"
import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts"

export function BudgetDisplay({ refreshKey = 0 }) {
  const [budget, setBudget] = useState(null)
  const [currentSpending, setCurrentSpending] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchBudgetData()
  }, [refreshKey])

  async function fetchBudgetData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
      const start = new Date(currentMonth)
      const end = new Date(new Date(start).setMonth(start.getMonth() + 1))

      // Fetch budget
      const { data: budgetData } = await supabase
        .from("budgets")
        .select("amount")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .single()

      // Fetch current spending
      const { data: expenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("user_id", user.id)
        .gte("spent_at", start.toISOString())
        .lt("spent_at", end.toISOString())

      const totalSpending = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0

      setBudget(budgetData)
      setCurrentSpending(totalSpending)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching budget data:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-64 w-full" />
  }

  const percentage = budget ? Math.min((currentSpending / budget.amount) * 100, 100) : 0
  const remaining = budget ? budget.amount - currentSpending : 0
  const isOverBudget = budget && currentSpending > budget.amount

  const radialData = budget ? [
    {
      name: "Spent",
      value: currentSpending,
      fill: isOverBudget ? "#ef4444" : "oklch(0.9307 0.2283 123.1)",
    },
    {
      name: "Remaining",
      value: Math.max(remaining, 0),
      fill: "#e5e7eb",
    }
  ] : []

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <CardDescription>{format(new Date(), 'MMMM yyyy')}</CardDescription>
          </div>
          {budget && (
            <div className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              {percentage.toFixed(0)}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {budget ? (
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={120}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="40%"
                  outerRadius="100%"
                  data={radialData}
                  startAngle={90}
                  endAngle={450}
                >
                  <RadialBar
                    dataKey="value"
                    background
                    fill={isOverBudget ? "#ef4444" : "oklch(0.9307 0.2283 123.1)"}
                    cornerRadius={10}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Spent</span>
                  <span className={`font-bold ${isOverBudget ? 'text-red-600' : ''}`}>
                    ${currentSpending.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Budget</span>
                  <span className="font-bold">${budget.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {isOverBudget ? 'Over' : 'Remaining'}
                  </span>
                  <span className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    ${Math.abs(remaining).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No budget set for this month</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}