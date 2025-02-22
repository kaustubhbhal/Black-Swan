"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export default function SignOutButton() {
  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
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

