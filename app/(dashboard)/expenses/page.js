"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { ExpenseTable } from "@/components/expense-table"
import { ExpenseForm } from "@/components/expense-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

const COLORS = [
  "oklch(0.9307 0.2283 123.1)",
  "oklch(0.8507 0.2083 123.1)",
  "oklch(0.7707 0.1883 123.1)",
  "oklch(0.6907 0.1683 123.1)",
  "oklch(0.6107 0.1483 123.1)",
  "oklch(0.5307 0.1283 123.1)",
  "oklch(0.4507 0.1083 123.1)",
  "oklch(0.3707 0.0883 123.1)",
]

export default function ExpensesPage() {
  const [chartsData, setChartsData] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    fetchChartsData()
  }, [refreshKey])

  async function fetchChartsData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const start = startOfMonth(new Date())
      const end = endOfMonth(new Date())

      const { data: expenses } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("spent_at", start.toISOString())
        .lte("spent_at", end.toISOString())

      // Category data for pie chart
      const categoryTotals = expenses?.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        return acc
      }, {}) || {}

      const categoryData = Object.entries(categoryTotals).map(([category, amount]) => ({
        name: category,
        value: amount,
      }))

      // Daily data for line chart
      const days = eachDayOfInterval({ start, end })
      const dailyData = days.map(day => {
        const dayStart = new Date(day.setHours(0, 0, 0, 0))
        const dayEnd = new Date(day.setHours(23, 59, 59, 999))
        
        const dayExpenses = expenses?.filter(e => {
          const expenseDate = new Date(e.spent_at)
          return expenseDate >= dayStart && expenseDate <= dayEnd
        }) || []
        
        const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0)
        
        return {
          date: format(day, "MMM dd"),
          amount: total,
        }
      })

      setChartsData({
        categoryData,
        dailyData,
        totalAmount: expenses?.reduce((sum, e) => sum + e.amount, 0) || 0,
        expenseCount: expenses?.length || 0,
      })
    } catch (error) {
      console.error("Error fetching charts data:", error)
    }
  }

  const handleExpenseAdded = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (!chartsData) return null

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track and manage your daily expenses</p>
        </div>
        <ExpenseForm onSuccess={handleExpenseAdded} />
      </div>
      <ExpenseTable onExpenseChange={handleExpenseAdded} />
      <div className="grid gap-6 mb-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Expenses</CardTitle>
              <CardDescription>
                Expenses over the current month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartsData.dailyData} margin={{ left: 0, right: 0, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    angle={-45}
                    textAnchor="end"
                    height={40}
                    interval="preserveStartEnd"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis width={35} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toFixed(2)}`, "Amount"]} 
                    contentStyle={{ 
                      backgroundColor: 'oklch(0.9307 0.2283 123.1)', 
                      border: 'none', 
                      borderRadius: '0.375rem',
                      color: 'black'
                    }}
                    labelStyle={{ color: 'black' }}
                    itemStyle={{ color: 'black' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="oklch(0.9307 0.2283 123.1)" 
                    strokeWidth={2}
                    name="Daily Total"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
  
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>
                Distribution of expenses by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartsData.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartsData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`$${value.toFixed(2)}`, "Amount"]} 
                    contentStyle={{ 
                      backgroundColor: 'oklch(0.9307 0.2283 123.1)', 
                      border: 'none', 
                      borderRadius: '0.375rem',
                      color: 'black'
                    }}
                    labelStyle={{ color: 'black' }}
                    itemStyle={{ color: 'black' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${chartsData.totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Current month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Number of Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{chartsData.expenseCount}</div>
              <p className="text-xs text-muted-foreground">Current month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average per Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${
                chartsData.expenseCount > 0 
                  ? (chartsData.totalAmount / chartsData.expenseCount).toFixed(2) 
                  : "0.00"
              }</div>
              <p className="text-xs text-muted-foreground">Per expense</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}