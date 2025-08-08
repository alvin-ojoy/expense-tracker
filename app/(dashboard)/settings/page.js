"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState("")
  const [darkMode, setDarkMode] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [])

  async function fetchUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setEmail(user.email)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  async function handleEmailChange(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error

      toast.success("Email change requested. Please check your email for confirmation.")
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email)
      if (error) throw error

      toast.success("Password reset email sent. Please check your email.")
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and settings</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your email and account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleEmailChange} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Email"}
                </Button>
              </form>

              <div className="border-t pt-4">
                <Label>Password</Label>
                <p className="text-sm text-muted-foreground mb-4">Click the button below to receive a password reset email.</p>
                <Button 
                  variant="outline" 
                  onClick={handlePasswordChange}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Reset Password"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="destructive" 
                onClick={handleSignOut}
                className="w-full"
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}