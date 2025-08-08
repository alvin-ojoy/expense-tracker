import { LandingNav } from "@/components/landing-nav"
import { Button } from "@/components/ui/button"
import { DollarSign, BarChart3, Shield, Zap } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-12 w-12 text-primary" />
              <span className="text-4xl font-bold">Expense Tracker</span>
            </div>
          </div>
          
          <h1 className="mb-6 text-5xl font-bold tracking-tight">
            Track Your Expenses with
            <span className="text-primary"> Confidence</span>
          </h1>
          
          <p className="mb-8 text-xl text-muted-foreground">
            Take control of your finances with our intuitive expense tracking platform. 
            Monitor spending, analyze patterns, and make informed financial decisions.
          </p>
          
          <div className="flex justify-center space-x-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Why Choose Expense Tracker?
            </h2>
            
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Visual Analytics</h3>
                <p className="text-muted-foreground">
                  Beautiful charts and graphs to visualize your spending patterns
                </p>
              </div>
              
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Secure & Private</h3>
                <p className="text-muted-foreground">
                  Your financial data is encrypted and secure with enterprise-grade protection
                </p>
              </div>
              
              <div className="text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-semibold">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Quick and easy expense entry with real-time updates and syncing
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-4 text-3xl font-bold">
              Ready to Take Control?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of users who are already managing their expenses smarter.
              Start your journey to financial awareness today.
            </p>
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Start Tracking Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Expense Tracker</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Expense Tracker. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}