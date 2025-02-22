"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  return (
    <Button
      onClick={handleSignOut}
      variant="ghost"
      className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition duration-150 ease-in-out"
    >
      Sign out
    </Button>
  )
}

