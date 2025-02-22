"use client"

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()

  const handleGoogleLogin = async () => {
    const result = await signIn("google", { callbackUrl: "/onboarding" })
    if (!result?.error) {
      localStorage.setItem("isLoggedIn", "true")
      router.push("/onboarding")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to BlackSwan</CardTitle>
          <CardDescription>Sign in to access your portfolio stress test</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoogleLogin} className="w-full">
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

