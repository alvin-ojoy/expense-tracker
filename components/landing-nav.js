"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DollarSign } from "lucide-react"

export function LandingNav() {
  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Expense Tracker</span>
          </Link>
        </div>
        
        <div className="ml-auto flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}