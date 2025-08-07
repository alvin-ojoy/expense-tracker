import { ExpenseTable } from "@/components/expense-table"
import { ExpenseForm } from "@/components/expense-form"

export default function ExpensesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track and manage your daily expenses</p>
        </div>
        <ExpenseForm />
      </div>

      <ExpenseTable />
    </div>
  )
}