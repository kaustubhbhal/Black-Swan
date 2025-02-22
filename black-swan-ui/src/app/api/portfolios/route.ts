import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db("black-swan")
    const portfoliosCollection = db.collection("portfolios")

    const portfolios = await portfoliosCollection
      .find({ userId: session.user.id })
      .project({ name: 1, isStarred: 1, lastUpdated: 1 })
      .toArray()

    return NextResponse.json(portfolios)
  } catch (error) {
    console.error("Error fetching portfolios:", error)
    return NextResponse.json({ error: "Failed to fetch portfolios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
  }

  try {
    const { name } = await request.json()

    const client = await clientPromise
    const db = client.db("black-swan")
    const portfoliosCollection = db.collection("portfolios")

    const result = await portfoliosCollection.insertOne({
      userId: session.user.id,
      name,
      holdings: [],
      isStarred: false,
      lastUpdated: new Date(),
    })

    return NextResponse.json({ id: result.insertedId, message: "Portfolio created successfully" })
  } catch (error) {
    console.error("Error creating portfolio:", error)
    return NextResponse.json({ error: "Failed to create portfolio" }, { status: 500 })
  }
}