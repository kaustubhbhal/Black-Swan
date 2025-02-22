import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import type { MongoClient } from "mongodb"

export async function GET() {
  try {
    const client: MongoClient = await clientPromise
    const db = client.db("black-swan")

    // Test 1: Basic connection
    await db.command({ ping: 1 })

    // Test 2: List collections to verify database access
    const collections = await db.listCollections().toArray()

    // Test 3: Check if required collections exist
    const requiredCollections = ["users", "accounts", "sessions"]
    const existingCollections = collections.map((col) => col.name)
    const missingCollections = requiredCollections.filter((name) => !existingCollections.includes(name))

    // Test 4: Verify write permissions by attempting to create and delete a test document
    let writePermissionTest = false
    try {
      const testCollection = db.collection("connection_test")
      await testCollection.insertOne({ test: true, timestamp: new Date() })
      await testCollection.deleteOne({ test: true })
      writePermissionTest = true
    } catch (writeError) {
      console.error("Write permission test failed:", writeError)
    }

    return NextResponse.json({
      status: "Database connection tests completed",
      details: {
        connected: true,
        databaseName: db.databaseName,
        collectionsFound: existingCollections,
        missingCollections,
        writePermissionTest: writePermissionTest ? "passed" : "failed",
      },
    })
  } catch (error) {
    console.error("MongoDB Connection Error:", error)
    return NextResponse.json(
      {
        error: "Failed to connect to MongoDB",
        details: (error as Error).message,
        help: `Please check:
          1. Your MONGODB_URI environment variable is correct
          2. Your IP address is whitelisted in MongoDB Atlas
          3. Your database user has correct permissions
          4. Your network allows connections to MongoDB Atlas`,
      },
      { status: 500 },
    )
  }
}

