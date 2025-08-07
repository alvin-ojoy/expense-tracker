"use client"

import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { Home, BarChart3, DollarSign, Settings } from "lucide-react"

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Expense Tracker</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/dashboard" className="flex items-center space-x-1 hover:text-[oklch(0.65_0.25_123.1)]">
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link href="/expenses" className="flex items-center space-x-1 hover:text-[oklch(0.65_0.25_123.1)]">
              <BarChart3 className="h-4 w-4" />
              <span>Expenses</span>
            </Link>
            <Link href="/summary" className="flex items-center space-x-1 hover:text-[oklch(0.65_0.25_123.1)]">
              <BarChart3 className="h-4 w-4" />
              <span>Summary</span>
            </Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
}