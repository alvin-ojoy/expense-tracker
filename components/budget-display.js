"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { TrendingUp } from "lucide-react"
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

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

  const chartConfig = {
    spent: {
      label: "Spent",
      color: "#e5e7eb",
    },
    remaining: {
      label: "Remaining",
      color: "oklch(0.9307 0.2283 123.1)",
    },
    overBudget: {
      label: "Over Budget",
      color: "#ef4444",
    },
  }

  const percentage = budget ? Math.min((currentSpending / budget.amount) * 100, 100) : 0
  const remaining = budget ? budget.amount - currentSpending : 0
  const isOverBudget = budget && currentSpending > budget.amount

  const chartData = budget ? [{
    month: format(new Date(), 'MMM yyyy'),
    spent: isOverBudget ? budget.amount : currentSpending,
    remaining: isOverBudget ? 0 : Math.max(remaining, 0),
    overBudget: isOverBudget ? currentSpending - budget.amount : 0,
  }] : []

  const total = budget ? budget.amount : 0
  const actualTotal = budget ? currentSpending : 0

  if (!budget) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
          <CardDescription>{format(new Date(), 'MMMM yyyy')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center pb-0">
          <div className="text-center text-muted-foreground py-8">
            <TrendingUp className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No budget set for this month</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
        <CardDescription>{format(new Date(), 'MMMM yyyy')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[200px]"
        >
          <RadialBarChart
            data={chartData}
            endAngle={180}
            innerRadius={60}
            outerRadius={100}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 16}
                          className="fill-foreground text-2xl font-bold"
                        >
                          ${actualTotal.toFixed(0)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 4}
                          className="fill-muted-foreground"
                        >
                          of ${total.toFixed(0)}
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
            
            <RadialBar
              dataKey="spent"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-spent)"
              className="stroke-transparent stroke-2"
            />
            <RadialBar
              dataKey="remaining"
              stackId="a"
              cornerRadius={5}
              fill="var(--color-remaining)"
              className="stroke-transparent stroke-2"
            />
            
            {isOverBudget && (
              <RadialBar
                dataKey="overBudget"
                stackId="a"
                cornerRadius={5}
                fill="var(--color-overBudget)"
                className="stroke-transparent stroke-2"
              />
            )}
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          {isOverBudget ? (
            <>
              Over budget by ${(currentSpending - budget.amount).toFixed(2)}
            </>
          ) : (
            <>
              {Math.round(percentage)}% of budget used
            </>
          )}
        </div>
        <div className="text-muted-foreground leading-none">
          {isOverBudget ? (
            <>
              ${(budget.amount - currentSpending).toFixed(2)} over budget
            </>
          ) : (
            <>
              ${remaining.toFixed(2)} remaining this month
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}