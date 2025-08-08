"use client"

import { useState } from "react"
import Link from "next/link"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { Home, BarChart3, DollarSign, Settings, Menu, X } from "lucide-react"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => {
    setIsOpen(false)
  }

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Expense Tracker</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium"
          >
            <Link href="/dashboard" className="flex items-center space-x-1 hover:text-primary"
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link href="/expenses" className="flex items-center space-x-1 hover:text-primary"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Expenses</span>
            </Link>
            <Link href="/budget" className="flex items-center space-x-1 hover:text-primary"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Budget</span>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <UserNav />
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md hover:bg-muted"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="px-4 py-3 space-y-3">
            <Link href="/dashboard" className="block" onClick={closeMenu}
            >
              <Button variant="ghost" className="w-full justify-start"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/expenses" className="block" onClick={closeMenu}
            >
              <Button variant="ghost" className="w-full justify-start"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Expenses
              </Button>
            </Link>
            <Link href="/budget" className="block" onClick={closeMenu}
            >
              <Button variant="ghost" className="w-full justify-start"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Budget
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}