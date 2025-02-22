/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { portfolioId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db("black-swan")
    const portfoliosCollection = db.collection("portfolios")

    const portfolio = await portfoliosCollection.findOne({
      _id: new ObjectId(params.portfolioId),
      userId: session.user.id,
    })

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    return NextResponse.json(portfolio)
  } catch (error) {
    console.error("Error fetching portfolio:", error)
    return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { portfolioId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
  }

  try {
    const { name, holdings, isStarred } = await request.json()
    const updateData: { [key: string]: any } = {}

    if (name !== undefined) updateData.name = name
    if (isStarred !== undefined) updateData.isStarred = isStarred

    if (holdings !== undefined) {
      // Calculate total value and percentages
      const totalValue = holdings.reduce((sum: number, holding: any) => sum + holding.value, 0)
      const holdingsWithPercentage = holdings.map((holding: any) => ({
        ...holding,
        percentOfPortfolio: ((holding.value / totalValue) * 100).toFixed(2),
      }))
      updateData.holdings = holdingsWithPercentage
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid update data provided" }, { status: 400 })
    }

    updateData.lastUpdated = new Date()

    const client = await clientPromise
    const db = client.db("black-swan")
    const portfoliosCollection = db.collection("portfolios")

    const result = await portfoliosCollection.updateOne(
      { _id: new ObjectId(params.portfolioId), userId: session.user.id },
      { $set: updateData },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Portfolio updated successfully" })
  } catch (error) {
    console.error("Error updating portfolio:", error)
    return NextResponse.json({ error: "Failed to update portfolio" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { portfolioId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db("black-swan")
    const portfoliosCollection = db.collection("portfolios")

    const result = await portfoliosCollection.deleteOne({
      _id: new ObjectId(params.portfolioId),
      userId: session.user.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Portfolio deleted successfully" })
  } catch (error) {
    console.error("Error deleting portfolio:", error)
    return NextResponse.json({ error: "Failed to delete portfolio" }, { status: 500 })
  }
}

