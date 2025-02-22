"use client"

import { useSession } from "next-auth/react"
import Navbar from "./Navbar"

export default function NavbarWrapper() {
  const { data: session, status } = useSession()

  return <Navbar session={session} status={status} />
}

