"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Portfolio = {
  stocks: number
  bonds: number
  cash: number
  realEstate: number
}

export default function DashboardContent() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    console.log("Client-side session:", session) // Debugging line
    console.log("Authentication status:", status) // Debugging line

    if (status === "unauthenticated") {
      router.push("/")
    }

    const savedPortfolio = localStorage.getItem("portfolio")
    if (savedPortfolio) {
      setPortfolio(JSON.parse(savedPortfolio))
    }
  }, [status, router, session])

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    return <div>Not authenticated. Redirecting...</div>
  }

  if (!portfolio) {
    return <div>Loading portfolio...</div>
  }

  const totalValue = Object.values(portfolio).reduce((sum, value) => sum + value, 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Portfolio Dashboard</h1>
        <div>
          <span className="mr-4">Welcome, {session?.user?.name}</span>
          <Button onClick={handleLogout}>Log Out</Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Overview</CardTitle>
          <CardDescription>Your current investment allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(portfolio).map(([key, value]) => (
              <div key={key} className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold text-lg">{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
                <p className="text-2xl font-bold">${value.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{((value / totalValue) * 100).toFixed(2)}% of portfolio</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <h3 className="font-semibold text-lg">Total Portfolio Value</h3>
            <p className="text-3xl font-bold">${totalValue.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

