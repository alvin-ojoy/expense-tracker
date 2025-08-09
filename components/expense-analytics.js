"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, subMonths, addMonths, eachDayOfInterval } from "date-fns"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Line,
  Legend
} from "recharts"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  PieChart as PieIcon,
  Target,
  Award,
  AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"

const NEON_COLORS = [
  "#00f5ff", // cyan
  "#ff0080", // pink  
  "#39ff14", // green
  "#ff6700", // orange
  "#8a2be2", // purple
  "#ffff00", // yellow
  "#ff1493", // deep pink
  "#00ff7f", // spring green
]

const CATEGORY_EMOJIS = {
  "Food": "🍔",
  "Transport": "🚗", 
  "Shopping": "🛍️",
  "Entertainment": "🎮",
  "Bills": "💡",
  "Health": "💊",
  "Other": "📦"
}

export function ExpenseAnalytics({ refreshKey = 0 }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const [lastRefresh, setLastRefresh] = useState(0)

  useEffect(() => {
    fetchExpenseAnalytics()
  }, [currentMonth, fetchExpenseAnalytics])

  // Only refresh when explicitly triggered, not on every key change
  useEffect(() => {
    if (refreshKey > 0 && refreshKey !== lastRefresh) {
      // Add small delay to prevent rapid updates
      const timer = setTimeout(() => {
        fetchExpenseAnalytics()
        setLastRefresh(refreshKey)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [refreshKey, lastRefresh, fetchExpenseAnalytics])

  const fetchExpenseAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)

      // Fetch expenses for current month
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('spent_at', start.toISOString())
        .lte('spent_at', end.toISOString())

      if (!expenses) {
        setAnalytics(null)
        return
      }

      // Category analysis
      const categoryAnalysis = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount
        return acc
      }, {})

      const categoryData = Object.entries(categoryAnalysis).map(([category, amount]) => ({
        category,
        amount,
        emoji: CATEGORY_EMOJIS[category] || "📊",
        percentage: (amount / expenses.reduce((sum, e) => sum + e.amount, 0)) * 100
      })).sort((a, b) => b.amount - a.amount)

      // Daily spending pattern
      const days = eachDayOfInterval({ start, end })
      const dailyData = days.map(day => {
        const dayStart = new Date(day.setHours(0, 0, 0, 0))
        const dayEnd = new Date(day.setHours(23, 59, 59, 999))
        
        const dayExpenses = expenses.filter(e => {
          const expenseDate = new Date(e.spent_at)
          return expenseDate >= dayStart && expenseDate <= dayEnd
        })

        return {
          date: format(day, "MMM dd"),
          weekday: format(day, "EEE"),
          amount: dayExpenses.reduce((sum, e) => sum + e.amount, 0),
          count: dayExpenses.length
        }
      })

      // Time-based analysis
      const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour}:00`,
        amount: expenses
          .filter(e => new Date(e.spent_at).getHours() === hour)
          .reduce((sum, e) => sum + e.amount, 0),
        count: expenses.filter(e => new Date(e.spent_at).getHours() === hour).length
      })).filter(h => h.amount > 0)

      // Weekly pattern
      const weekdayData = [
        'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
      ].map((day, index) => ({
        day,
        amount: expenses
          .filter(e => new Date(e.spent_at).getDay() === index)
          .reduce((sum, e) => sum + e.amount, 0),
        count: expenses.filter(e => new Date(e.spent_at).getDay() === index).length
      }))

      // Spending insights
      const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
      const avgDaily = totalAmount / new Date().getDate()
      const avgPerExpense = totalAmount / expenses.length
      const maxExpense = Math.max(...expenses.map(e => e.amount))
      const minExpense = Math.min(...expenses.map(e => e.amount))

      // Trend analysis
      const previousMonthStart = startOfMonth(subMonths(currentMonth, 1))
      const previousMonthEnd = endOfMonth(subMonths(currentMonth, 1))
      
      const { data: prevExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('spent_at', previousMonthStart.toISOString())
        .lte('spent_at', previousMonthEnd.toISOString())

      const prevTotal = prevExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0
      const trendChange = prevTotal > 0 ? ((totalAmount - prevTotal) / prevTotal) * 100 : 0

      // Risk factors
      const largeExpenses = expenses.filter(e => e.amount > avgPerExpense * 3)
      const frequentCategories = categoryData.filter(c => c.count > expenses.length * 0.15)

      setAnalytics({
        totalAmount,
        expenseCount: expenses.length,
        avgDaily,
        avgPerExpense,
        maxExpense,
        minExpense,
        trendChange,
        categoryData,
        dailyData,
        hourlyData,
        weekdayData,
        largeExpenses,
        topCategory: categoryData[0],
        bottomCategory: categoryData[categoryData.length - 1]
      })

    } catch (error) {
      console.error("Error fetching expense analytics:", error)
    } finally {
      setLoading(false)
    }
  }, [currentMonth, supabase])

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  if (loading) {
    return <AnalyticsSkeleton />
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No expenses this month</p>
            <p className="text-sm text-muted-foreground">Start tracking your expenses to see analytics</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('prev')}
        >
          <Calendar className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <h2 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('next')}
        >
          Next
          <Calendar className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalAmount.toFixed(2)}</div>
            <div className="flex items-center text-xs">
              {analytics.trendChange > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
                  <span className="text-red-500">+{analytics.trendChange.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
                  <span className="text-green-500">{analytics.trendChange.toFixed(1)}%</span>
                </>
              )}
              <span className="ml-1 text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.avgDaily.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per day this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Most Expensive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.maxExpense.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Single expense</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Expense Count</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.expenseCount}</div>
            <p className="text-xs text-muted-foreground">Transactions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1">
          <TabsTrigger value="insights" className="text-xs sm:text-sm">Insights</TabsTrigger>
          <TabsTrigger value="patterns" className="text-xs sm:text-sm">Daily Patterns</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs sm:text-sm">Categories</TabsTrigger>
          <TabsTrigger value="time" className="text-xs sm:text-sm">Time Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spending Insights</CardTitle>
                <CardDescription>AI-powered insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.topCategory && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{analytics.topCategory.emoji}</span>
                      <span className="text-sm">Top spender: {analytics.topCategory.category}</span>
                    </div>
                    <Badge variant="outline">${analytics.topCategory.amount.toFixed(2)}</Badge>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm">Daily average</span>
                  </div>
                  <Badge variant="outline">${analytics.avgDaily.toFixed(2)}</Badge>
                </div>

                {analytics.largeExpenses.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-600">{analytics.largeExpenses.length} large expense{analytics.largeExpenses.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Monthly milestones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm">{analytics.expenseCount} transactions tracked</span>
                </div>
                
                {analytics.trendChange < 0 && (
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5 text-green-500" />
                    <span className="text-sm">Spending decreased {Math.abs(analytics.trendChange).toFixed(1)}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Spending Pattern</CardTitle>
                <CardDescription>Spending by day of the month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      <Area type="monotone" dataKey="amount" stroke="#00f5ff" fill="#00f5ff" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Pattern</CardTitle>
                <CardDescription>Spending by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.weekdayData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      <Bar dataKey="amount" fill="#ff0080" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                        data={analytics.categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        labelLine={false}
                        label={({ category, percentage }) => `${category} ${percentage.toFixed(0)}%`}
                        dataKey="amount"
                      >
                        {analytics.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={NEON_COLORS[index % NEON_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Radar</CardTitle>
                <CardDescription>Category spending intensity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={analytics.categoryData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="category" />
                      <PolarRadiusAxis />
                      <Radar name="Spending" dataKey="amount" stroke="#39ff14" fill="#39ff14" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Spending Pattern</CardTitle>
              <CardDescription>When you spend the most</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Bar dataKey="amount" fill="#8a2be2" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="count" stroke="#ffff00" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}