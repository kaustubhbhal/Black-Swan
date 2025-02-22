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
  isSelected: boolean
  onSelect: (event: Event) => void
}

const rarityColors = {
  common: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  uncommon: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  very_uncommon: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function EventCard({ event, isSelected, onSelect }: EventCardProps) {
  const rarityColor = rarityColors[event.rarity as keyof typeof rarityColors] || rarityColors.common

  return (
    <Card
      className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
      onClick={() => onSelect(event)}
    >
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{event.name}</CardTitle>
          <Badge className={rarityColor}>{event.rarity.replace(/_/g, " ")}</Badge>
        </div>
        <CardDescription>{event.start_date}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{event.description}</p>
      </CardContent>
    </Card>
  )
}

