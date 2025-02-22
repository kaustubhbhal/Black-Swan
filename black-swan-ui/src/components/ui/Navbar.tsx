"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Session } from "next-auth"
import SignOutButton from "./SignOutButton"
import MobileMenu from "./MobileMenu"
import { useTheme } from "@/app/contexts/ThemeContext"
import { ChevronDown } from "lucide-react"

interface NavbarProps {
  session: Session | null
  status: "loading" | "authenticated" | "unauthenticated"
}

export default function Navbar({ session, status }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { theme } = useTheme()

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/portfolios", label: "Portfolios" },
    { href: "/onboarding", label: "Add Info" },
    { href: "/stress-test", label: "Stress Test" },
    { href: "/settings", label: "Settings" },
  ]

  return (
    <nav className="bg-gray-800 dark:bg-gray-900 text-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <div className="relative w-8 h-8 mr-2">
              {!imageError ? (
                <Image
                  src="/logo.png"
                  alt="BlackSwan Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                  onError={() => setImageError(true)}
                  priority
                />
              ) : (
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-800 font-bold text-xs">
                  BS
                </div>
              )}
            </div>
            <span className="text-2xl font-bold">BlackSwan</span>
          </Link>
          {status === "authenticated" && (
            <>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <div className="relative group">
                    <button
                      onClick={() => setIsOpen(!isOpen)}
                      className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:text-white focus:bg-gray-700 transition duration-150 ease-in-out"
                    >
                      Menu
                      <ChevronDown
                        className={`ml-1 h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <div
                      className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-in-out ${
                        isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                      }`}
                    >
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setIsOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <SignOutButton />
                </div>
              </div>
              <MobileMenu>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 dark:hover:bg-gray-800"
                  >
                    {link.label}
                  </Link>
                ))}
                <SignOutButton />
              </MobileMenu>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

