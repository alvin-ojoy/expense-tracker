"use client"

import { useState } from "react"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Plus, Edit } from "lucide-react"

const budgetSchema = z.object({
  amount: z.string().min(1, "Amount is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
})

export function BudgetForm({ currentMonth, existingBudget, onBudgetUpdated }) {
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  const form = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      amount: existingBudget?.amount.toString() || "",
    },
  })

  // Ensure currentMonth is a valid Date object
  const safeCurrentMonth = currentMonth || new Date()

  async function onSubmit(values) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Please sign in to set budgets")
        return
      }

      const monthStr = safeCurrentMonth.toISOString().split('T')[0]
      const amount = parseFloat(values.amount)

      if (existingBudget) {
        const { error } = await supabase
          .from('budgets')
          .update({ 
            amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBudget.id)
          .eq('user_id', user.id)

        if (error) throw error
        toast.success("Budget updated successfully")
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert({
            user_id: user.id,
            month: monthStr,
            amount,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) {
          if (error.code === '23505') {
            toast.error("Budget already exists for this month")
            return
          }
          throw error
        }
        toast.success("Budget created successfully")
      }

      setOpen(false)
      onBudgetUpdated?.()
    } catch (error) {
      console.error('Error saving budget:', error)
      toast.error("Failed to save budget")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {existingBudget ? (
          <Button variant="ghost" size="sm" className="px-2 h-auto text-xs">
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Set Budget
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {existingBudget ? 'Edit Budget' : 'Set Monthly Budget'}
          </DialogTitle>
          <DialogDescription>
            Set your budget for {format(safeCurrentMonth, 'MMMM yyyy')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="1000.00"
                        className="pl-7"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter your total monthly budget amount
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">
                {existingBudget ? 'Update Budget' : 'Create Budget'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}