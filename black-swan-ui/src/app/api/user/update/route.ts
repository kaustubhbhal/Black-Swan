import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import clientPromise from "@/lib/mongodb"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { name, email, darkMode, emailNotifications } = await request.json()

  try {
    const client = await clientPromise
    const db = client.db("black-swan")
    const usersCollection = db.collection("users")

    await usersCollection.updateOne(
      { email: session.user.email },
      {
        $set: {
          name,
          email,
          darkMode,
          emailNotifications,
        },
      },
    )

    return NextResponse.json({ message: "Settings updated successfully" })
  } catch (error) {
    console.error("Failed to update user settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

