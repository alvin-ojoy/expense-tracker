import { LoginForm } from "@/components/login-form"
import { LandingNav } from "@/components/landing-nav"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}