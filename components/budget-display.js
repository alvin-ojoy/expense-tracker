"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { TrendingUp, Plus, Edit, Trash2 } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label as FormLabel } from "@/components/ui/label"
import { toast } from "sonner"

export function BudgetDisplay({ refreshKey = 0, onBudgetUpdated }) {
  const [budget, setBudget] = useState(null)
  const [currentSpending, setCurrentSpending] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [budgetAmount, setBudgetAmount] = useState("")
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

  const handleSetBudget = async () => {
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      toast.error("Please enter a valid budget amount")
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
      const amount = parseFloat(budgetAmount)

      const { error } = await supabase
        .from('budgets')
        .upsert({
          user_id: user.id,
          month: currentMonth,
          amount: amount
        }, {
          onConflict: 'user_id,month'
        })

      if (error) throw error

      toast.success(budget ? "Budget updated successfully" : "Budget created successfully")
      setBudget({ amount })
      setEditing(false)
      setBudgetAmount("")
      if (onBudgetUpdated) onBudgetUpdated()
    } catch (error) {
      console.error("Error setting budget:", error)
      toast.error("Failed to set budget")
    }
  }

  const handleUpdateBudget = async () => {
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      toast.error("Please enter a valid budget amount")
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
      const amount = parseFloat(budgetAmount)

      const { error } = await supabase
        .from('budgets')
        .update({ amount })
        .eq('user_id', user.id)
        .eq('month', currentMonth)

      if (error) throw error

      toast.success("Budget updated successfully")
      setBudget({ amount })
      setEditing(false)
      setBudgetAmount("")
      if (onBudgetUpdated) onBudgetUpdated()
    } catch (error) {
      console.error("Error updating budget:", error)
      toast.error("Failed to update budget")
    }
  }

  const handleDeleteBudget = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('user_id', user.id)
        .eq('month', currentMonth)

      if (error) throw error

      toast.success("Budget deleted successfully")
      setBudget(null)
      setEditing(false)
      setBudgetAmount("")
      if (onBudgetUpdated) onBudgetUpdated()
    } catch (error) {
      console.error("Error deleting budget:", error)
      toast.error("Failed to delete budget")
    }
  }

  const startEditing = () => {
    setBudgetAmount(budget ? budget.amount.toString() : "")
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setBudgetAmount("")
  }

  if (!budget && !editing) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
          <CardDescription>{format(new Date(), 'MMMM yyyy')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <div className="text-center text-muted-foreground">
            <TrendingUp className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No budget set for this month</p>
          </div>
          <Button onClick={() => setEditing(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Set Budget
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (editing) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {budget ? 'Update Budget' : 'Set Budget'}
          </CardTitle>
          <CardDescription>{format(new Date(), 'MMMM yyyy')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <FormLabel htmlFor="budget-amount">Budget Amount</FormLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="budget-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="1000.00"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={budget ? handleUpdateBudget : handleSetBudget} 
              size="sm" 
              className="flex-1"
            >
              {budget ? 'Update' : 'Set'}
            </Button>
            <Button 
              onClick={cancelEditing} 
              variant="outline" 
              size="sm" 
              className="flex-1"
            >
              Cancel
            </Button>
            {budget && (
              <Button 
                onClick={handleDeleteBudget} 
                variant="destructive" 
                size="sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <div className="flex items-center justify-between w-full">
          <div>
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <CardDescription>{format(new Date(), 'MMMM yyyy')}</CardDescription>
          </div>
          <Button 
            onClick={startEditing} 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2"
          >
            <Edit className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[200px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={-30}
            endAngle={210}
            innerRadius={80}
            outerRadius={120}
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
                          y={(viewBox.cy || 0) + 4}
                          className="fill-foreground text-2xl font-bold"
                        >
                          ${remaining.toFixed(2)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
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