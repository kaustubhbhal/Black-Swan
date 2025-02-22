import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, TrendingUp, ShieldCheck } from "lucide-react"

type Recommendation = {
  title: string
  description: string
  icon: React.ReactNode
}

const recommendations: Recommendation[] = [
  {
    title: "Diversify Your Portfolio",
    description: "Consider adding assets from different sectors or geographic regions to reduce overall risk.",
    icon: <TrendingUp className="h-6 w-6 text-blue-500" />,
  },
  {
    title: "Increase Risk Management",
    description: "Implement stop-loss orders or consider hedging strategies to protect against significant downturns.",
    icon: <ShieldCheck className="h-6 w-6 text-green-500" />,
  },
  {
    title: "Review High-Risk Assets",
    description:
      "Evaluate assets with high beta or volatility. Consider reducing exposure if they don't align with your risk tolerance.",
    icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
  },
]

export function StressTestRecommendations() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendations</CardTitle>
        <CardDescription>Based on your stress test results, consider the following actions:</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center text-lg font-semibold">
                  {rec.icon}
                  <span className="ml-2">{rec.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{rec.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

