"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function BudgetForm({ refreshKey = 0, onSuccess }) {
  const [amount, setAmount] = useState("")
  const [currentBudget, setCurrentBudget] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState("set") // "set" or "add"
  const supabase = createClient()

  useEffect(() => {
    fetchCurrentBudget()
  }, [refreshKey])

  async function fetchCurrentBudget() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
      const { data: budget } = await supabase
        .from("budgets")
        .select("amount")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .single()

      setCurrentBudget(budget?.amount || 0)
    } catch (error) {
      console.error("Error fetching current budget:", error)
      setCurrentBudget(0)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user logged in")

      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
      const newAmount = mode === "add" 
        ? (currentBudget || 0) + parseFloat(amount)
        : parseFloat(amount)

      const { error } = await supabase
        .from("budgets")
        .upsert({
          user_id: user.id,
          month: currentMonth,
          amount: newAmount
        }, {
          onConflict: 'user_id,month'
        })

      if (error) throw error

      toast.success(`Budget ${mode === "add" ? "increased" : "updated"} successfully!`)
      setAmount("")
      setCurrentBudget(newAmount)
      if (onSuccess) onSuccess()
    } catch (error) {
      setError(error.message)
      toast.error("Failed to update budget")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget</CardTitle>
        <CardDescription>
          {currentBudget > 0 && (
            <span className="text-sm font-medium">Current: ${currentBudget.toFixed(2)}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "set" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setMode("set")}
              >
                Set New
              </Button>
              <Button
                type="button"
                variant={mode === "add" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setMode("add")}
              >
                Add More
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="budget">
                {mode === "add" ? "Amount to Add" : "New Budget Amount"}
              </Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                placeholder={mode === "add" ? "Enter amount to add" : "Enter new budget amount"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
          
          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && (<Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {loading ? "Saving..." : mode === "add" ? "Add to Budget" : "Set Budget"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}