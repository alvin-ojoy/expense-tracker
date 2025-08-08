"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExpenseForm } from "@/components/expense-form"
import { Skeleton } from "@/components/ui/skeleton"

export function ExpenseTable({ onExpenseChange, refreshKey = 0 }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  async function fetchExpenses() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("spent_at", { ascending: false })

      if (error) {
        console.error("Error fetching expenses:", error)
        toast.error("Failed to fetch expenses")
        return
      }
      
      setExpenses(data || [])
      
      if (onExpenseChange) {
        onExpenseChange()
      }
    } catch (error) {
      console.error("Error fetching expenses:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  async function deleteExpense(id) {
    try {
      await supabase.from("expenses").delete().eq("id", id)
      fetchExpenses()
    } catch (error) {
      console.error("Error deleting expense:", error)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [refreshKey])

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No expenses found
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{format(new Date(expense.spent_at), "MMM dd, yyyy")}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>
                  <Badge variant="outline">{expense.category}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${expense.amount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <ExpenseForm expense={expense} onSuccess={() => fetchExpenses()} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}