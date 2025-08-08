"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns"
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BudgetForm } from "@/components/budget-form"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"

const COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#84cc16", // lime-500
  "#f97316", // orange-500
]

export function BudgetDashboard() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()))
  const [budgetData, setBudgetData] = useState(null)
  const [expenseData, setExpenseData] = useState(null)
  const [categoryBreakdown, setCategoryBreakdown] = useState([])
  const [budgetHistory, setBudgetHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    fetchBudgetData()
  }, [currentMonth, refreshKey])

  async function fetchBudgetData() {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const monthStart = startOfMonth(currentMonth)
      const monthEnd = endOfMonth(currentMonth)

      // Fetch budget for current month
      const { data: budget } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', monthStart.toISOString().split('T')[0])
        .single()

      // Fetch expenses for current month
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('spent_at', monthStart.toISOString())
        .lte('spent_at', monthEnd.toISOString())

      // Calculate category breakdown
      const categoryTotals = expenses?.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + parseFloat(expense.amount)
        return acc
      }, {}) || {}

      const categoryBreakdown = Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        amount,
        percentage: budget?.amount ? (amount / budget.amount) * 100 : 0
      }))

      // Fetch budget history for trend analysis
      const { data: history } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false })
        .limit(6)

      setBudgetData(budget)
      setExpenseData(expenses || [])
      setCategoryBreakdown(categoryBreakdown)
      setBudgetHistory(history || [])

    } catch (error) {
      console.error('Error fetching budget data:', error)
      toast.error('Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  const totalSpent = expenseData?.reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0
  const budgetAmount = budgetData?.amount || 0
  const remainingBudget = budgetAmount - totalSpent
  const budgetProgress = budgetAmount > 0 ? (totalSpent / budgetAmount) * 100 : 0

  const isOverBudget = remainingBudget < 0
  const dangerThreshold = budgetProgress > 90

  const monthlyTrend = budgetHistory.slice().reverse().map(item => ({
    month: format(new Date(item.month), 'MMM yyyy'),
    budget: item.amount,
    spent: expenseData?.reduce((sum, expense) => {
      const expenseMonth = startOfMonth(new Date(expense.spent_at))
      const budgetMonth = startOfMonth(new Date(item.month))
      return expenseMonth.getTime() === budgetMonth.getTime() 
        ? sum + parseFloat(expense.amount) 
        : sum
    }, 0) || 0
  }))

  const handleBudgetUpdated = () => {
    setRefreshKey(prev => prev + 1)
  }

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    )
  }

  if (loading) {
    return <BudgetSkeleton />
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
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="text-center">
          <h2 className="text-xl font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateMonth('next')}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${budgetAmount.toLocaleString()}
            </div>
            <BudgetForm 
              currentMonth={currentMonth} 
              existingBudget={budgetData}
              onBudgetUpdated={handleBudgetUpdated}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {expenseData.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
              ${Math.abs(remainingBudget).toLocaleString()}
            </div>
            <Badge 
              variant={isOverBudget ? "destructive" : "default"}
              className="mt-1"
            >
              {isOverBudget ? 'Over Budget' : 'Under Budget'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress 
                value={Math.min(budgetProgress, 100)} 
                className={dangerThreshold ? 'bg-red-200' : ''}
              />
              <div className="text-sm font-medium">
                {budgetProgress.toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="breakdown" className="text-xs sm:text-sm">Breakdown</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Spending</CardTitle>
                <CardDescription>
                  Current month budget utilization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Spent', value: totalSpent },
                          { name: 'Remaining', value: Math.max(remainingBudget, 0) }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#ef4444" />
                        <Cell fill="#10b981" />
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Daily Average</span>
                  <span className="font-medium">
                    ${expenseData.length ? (totalSpent / new Date().getDate()).toFixed(2) : '0'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Largest Category</span>
                  <span className="font-medium">
                    {categoryBreakdown[0]?.category || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Budget Status</span>
                  <Badge 
                    variant={isOverBudget ? "destructive" : "default"}
                  >
                    {isOverBudget ? <TrendingDown className="h-3 w-3 mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
                    {isOverBudget ? 'Over' : 'On Track'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>
                Spending by category with budget allocation insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBreakdown} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={100} />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget Trends</CardTitle>
              <CardDescription>
                Monthly budget vs actual spending over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="budget" stroke="#3b82f6" name="Budget" />
                    <Line type="monotone" dataKey="spent" stroke="#ef4444" name="Spent" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alerts */}
      {dangerThreshold && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center space-x-2 p-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">
              Warning: You&apos;ve used {budgetProgress.toFixed(1)}% of your monthly budget!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function BudgetSkeleton() {
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