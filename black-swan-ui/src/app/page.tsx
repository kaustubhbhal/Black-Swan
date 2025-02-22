"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  if (status === "loading") {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (status === "authenticated") {
    return null // This will prevent any flash of content before redirect
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
      <div className="max-w-3xl mx-auto text-center px-4">
        <h1 className="text-6xl font-bold mb-6 animate-fade-in-up">
          Welcome to <span className="text-gray-600">Black Swan</span>
        </h1>
        <p className="text-xl mb-8 animate-fade-in-up animation-delay-200">
          Prepare for the unexpected. Stress test your portfolio against black swan events and optimize your investment
          strategy.
        </p>
        <Button
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          size="lg"
          className="bg-black text-white hover:bg-gray-800 transition-all duration-200 animate-fade-in-up animation-delay-400"
        >
          Get Started
        </Button>
      </div>
      <div className="mt-16 text-sm text-gray-400 animate-fade-in-up animation-delay-600">
        Powered by advanced AI and financial modeling
      </div>
    </div>
  )
}

