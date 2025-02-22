import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { ObjectId } from "mongodb"

export async function PUT(request: Request, { params }: { params: { portfolioId: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
  }

  try {
    const client = await clientPromise
    const db = client.db("black-swan")
    const portfoliosCollection = db.collection("portfolios")

    // Unstar all portfolios
    await portfoliosCollection.updateMany({ userId: session.user.id }, { $set: { isStarred: false } })

    // Star the selected portfolio
    const result = await portfoliosCollection.updateOne(
      { _id: new ObjectId(params.portfolioId), userId: session.user.id },
      { $set: { isStarred: true } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    // Fetch the updated portfolio
    const updatedPortfolio = await portfoliosCollection.findOne({
      _id: new ObjectId(params.portfolioId),
      userId: session.user.id,
    })

    return NextResponse.json({ message: "Portfolio starred successfully", portfolio: updatedPortfolio })
  } catch (error) {
    console.error("Error starring portfolio:", error)
    return NextResponse.json({ error: "Failed to star portfolio" }, { status: 500 })
  }
}

