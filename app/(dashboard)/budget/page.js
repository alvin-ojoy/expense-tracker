import { BudgetDashboard } from "@/components/budget-dashboard"

export default function BudgetPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Budget Management</h1>
          <p className="text-muted-foreground">
            Track your spending against monthly budgets
          </p>
        </div>
      </div>
      <BudgetDashboard />
    </div>
  )
}