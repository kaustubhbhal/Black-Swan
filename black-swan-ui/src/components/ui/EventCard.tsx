import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Event = {
  name: string
  start_date: string
  description: string
  rarity: string
}

type EventCardProps = {
  event: Event
}

const rarityColors = {
  common: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  uncommon: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  very_uncommon: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function EventCard({ event }: EventCardProps) {
  // Add null checks and default values
  const name = event?.name || "Unknown Event"
  const startDate = event?.start_date || "Unknown Date"
  const description = event?.description || "No description available"
  const rarity = event?.rarity || "common"

  // Safely access the rarity color
  const rarityColor = rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{name}</CardTitle>
          <Badge className={rarityColor}>{rarity.replace(/_/g, " ")}</Badge>
        </div>
        <CardDescription>{startDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{description}</p>
      </CardContent>
    </Card>
  )
}

