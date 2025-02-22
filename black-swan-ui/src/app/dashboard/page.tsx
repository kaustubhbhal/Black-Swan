import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "../api/auth/[...nextauth]/route"
import DashboardContent from "./dashboard-content"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  console.log("Server-side session:", session) // Debugging line

  if (!session) {
    console.log("Redirecting to login page") // Debugging line
    redirect("/")
  }

  return <DashboardContent />
}

