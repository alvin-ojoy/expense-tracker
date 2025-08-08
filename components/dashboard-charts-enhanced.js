"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from "date-fns"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  Legend
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, DollarSign, Target, Activity } from "lucide-react"

// NEW GREEN COLOR SCHEME
// Using oklch(0.9307 0.2283 123.1) as primary
// To revert, use values from dashboard-colors-backup.js

const ROBINHOOD_COLORS = {
  primary: "oklch(0.9307 0.2283 123.1)",
  light: "oklch(0.8507 0.2083 123.1)",
  dark: "oklch(0.7707 0.1883 123.1)",
  accent: "#1E1E1E",
  background: "#FFFFFF",
  muted: "#F5F5F5"
}

const PIE_COLORS = [
  "oklch(0.9307 0.2283 123.1)", // Primary green
  "oklch(0.8507 0.2083 123.1)", // Darker green
  "oklch(0.7707 0.1883 123.1)", // Medium green
  "oklch(0.6907 0.1683 123.1)", // Darker green
  "oklch(0.6107 0.1483 123.1)", // Even darker green
  "oklch(0.5307 0.1283 123.1)", // Dark green
  "oklch(0.4507 0.1083 123.1)", // Very dark green
]

export function DashboardChartsEnhanced({ refreshKey = 0 }) {
  const [data, setData] = useState(null)
  const [budgetData, setBudgetData] = useState(null)
  const [trendData, setTrendData] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [refreshKey])

  async function fetchData() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const start = startOfMonth(new Date())
      const end = endOfMonth(new Date())

      // Fetch expenses
      const { data: expenses } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("spent_at", start.toISOString())
        .lte("spent_at", end.toISOString())

      // Fetch budget
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
      const { data: budget } = await supabase
        .from("budgets")
        .select("amount")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .single()

      // Fetch last 7 days for trend
      const weekStart = subDays(new Date(), 7)
      const { data: weekExpenses } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("spent_at", weekStart.toISOString())

      processData(expenses || [], budget, weekExpenses || [])
      setLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      setLoading(false)
    }
  }

  function processData(expenses, budget, weekExpenses) {
    // Enhanced category data with percentages
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {})

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
    
    const categoryData = Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: amount,
      percentage: ((amount / totalAmount) * 100).toFixed(1)
    })).sort((a, b) => b.value - a.value)

    // Enhanced daily data with gradient area
    const start = startOfMonth(new Date())
    const end = endOfMonth(new Date())
    const days = eachDayOfInterval({ start, end })

    const dailyData = days.map(day => {
      const dayStart = new Date(day.setHours(0, 0, 0, 0))
      const dayEnd = new Date(day.setHours(23, 59, 59, 999))
      
      const dayExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.spent_at)
        return expenseDate >= dayStart && expenseDate <= dayEnd
      })
      
      const total = dayExpenses.reduce((sum, e) => sum + e.amount, 0)
      const count = dayExpenses.length
      
      return {
        date: format(day, "MMM dd"),
        fullDate: format(day, "EEE"),
        amount: total,
        count: count
      }
    })

    // Weekly trend data
    const weekStart = subDays(new Date(), 7)
    const weekDays = Array.from({ length: 8 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(date.getDate() + i)
      return date
    })

    const weeklyTrend = weekDays.map(day => {
      const dayStart = new Date(day.setHours(0, 0, 0, 0))
      const dayEnd = new Date(day.setHours(23, 59, 59, 999))
      
      const dayExpenses = weekExpenses.filter(e => {
        const expenseDate = new Date(e.spent_at)
        return expenseDate >= dayStart && expenseDate <= dayEnd
      })
      
      return {
        day: format(day, "EEE"),
        amount: dayExpenses.reduce((sum, e) => sum + e.amount, 0)
      }
    })

    // Budget progress data for radial chart
    const budgetProgress = budget ? {
      spent: Math.min(totalAmount, budget.amount),
      remaining: Math.max(budget.amount - totalAmount, 0),
      over: Math.max(totalAmount - budget.amount, 0),
      percentage: (totalAmount / budget.amount) * 100
    } : null

    setData({
      categoryData,
      dailyData,
      weeklyTrend,
      totalAmount,
      expenseCount: expenses.length,
      budgetProgress,
      budgetAmount: budget?.amount || 0
    })
    setBudgetData(budget)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-white bg-[oklch(0.9307_0.2283_123.1)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-black">
              <DollarSign className="h-4 w-4 text-black" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              ${data.totalAmount.toFixed(2)}
            </div>
            <p className="text-xs text-black/80">
              This month • {data.expenseCount} transactions
            </p>
          </CardContent>
        </Card>

        {budgetData && (
          <Card className="border-l-4 border-l-[#00A505]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-[#00A505]" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: ROBINHOOD_COLORS.dark }}>
                ${data.budgetAmount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Monthly target
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="border-l-4 border-l-[#66E085]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#66E085]" />
              Daily Average
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: ROBINHOOD_COLORS.light }}>
              ${(data.dailyData.reduce((sum, d) => sum + d.amount, 0) / new Date().getDate() || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per day average
            </p>
          </CardContent>
        </Card>

        {data.budgetProgress && (
          <Card className="border-l-4 border-l-[data.budgetProgress.percentage > 100 ? '#ef4444' : '#00C805']">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {data.budgetProgress.percentage > 100 ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-[#00C805]" />
                )}
                Budget Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${data.budgetProgress.percentage > 100 ? 'text-red-600' : 'text-[#00C805]'}`}>
                {data.budgetProgress.percentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {data.budgetProgress.percentage > 100 ? 'Over budget' : 'On track'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Enhanced Area Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Spending Flow</CardTitle>
            <CardDescription>Your daily expense rhythm</CardDescription>
          </CardHeader>
          <CardContent className="-mx-2">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart 
                data={data.dailyData} 
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C805" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00C805" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toFixed(2)}`, "Spent"]}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ color: '#333', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={ROBINHOOD_COLORS.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSpending)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Enhanced Donut Chart */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Category Symphony</CardTitle>
            <CardDescription>Where your money flows</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  labelLine={false}
                >
                  {data.categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`$${value.toFixed(2)}`, "Amount"]}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend 
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Trend</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={data.weeklyTrend.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 10, fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#666' }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toFixed(2)}`, "Spent"]}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill={ROBINHOOD_COLORS.primary} 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {data.budgetProgress && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget Progress</CardTitle>
              <CardDescription>Current utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="60%" 
                  outerRadius="90%" 
                  data={[
                    {
                      name: 'Spent',
                      value: Math.min(data.budgetProgress.percentage, 100),
                      fill: data.budgetProgress.percentage > 100 ? '#ef4444' : '#00C805'
                    }
                  ]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10}
                  />
                  <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dominantBaseline="middle" 
                    className="text-lg font-bold fill-current"
                  >
                    {data.budgetProgress.percentage.toFixed(0)}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Category</CardTitle>
            <CardDescription>Biggest spender</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {data.categoryData.length > 0 && (
              <>
                <div className="text-2xl font-bold text-[#00C805]">
                  {data.categoryData[0].name}
                </div>
                <div className="text-sm text-muted-foreground">
                  ${data.categoryData[0].value.toFixed(2)} ({data.categoryData[0].percentage}%)
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function DashboardOverview({ refreshKey = 0 }) {
  return <DashboardChartsEnhanced refreshKey={refreshKey} />
}