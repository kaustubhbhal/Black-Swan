"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Portfolio = {
  stocks: number
  bonds: number
  cash: number
  realEstate: number
}

export default function OnboardingPage() {
  const [portfolio, setPortfolio] = useState<Portfolio>({
    stocks: 0,
    bonds: 0,
    cash: 0,
    realEstate: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn")
    console.log("isLoggedIn", isLoggedIn)
    if (!isLoggedIn) {
      router.push("/")
    }
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPortfolio((prev) => ({ ...prev, [name]: Number.parseFloat(value) || 0 }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem("portfolio", JSON.stringify(portfolio))
    router.push("/dashboard")
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Set Up Your Portfolio</CardTitle>
          <CardDescription>Enter the current value of your investments</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.entries(portfolio).map(([key, value]) => (
              <div key={key}>
                <Label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)} ($)</Label>
                <Input id={key} name={key} type="number" value={value} onChange={handleInputChange} required />
              </div>
            ))}
            <Button type="submit" className="w-full">
              Save Portfolio
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

