import Link from "next/link"
import type { Session } from "next-auth"
import SignOutButton from "./SignOutButton"
import MobileMenu from "./MobileMenu"

interface NavbarProps {
  session: Session | null
  status: "loading" | "authenticated" | "unauthenticated"
}

export default function Navbar({ session, status }: NavbarProps) {
  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold">BlackSwan</span>
          </Link>
          {status === "authenticated" && (
            <>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link
                    href="/dashboard"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition duration-150 ease-in-out"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/onboarding"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition duration-150 ease-in-out"
                  >
                    Onboarding
                  </Link>
                  <Link
                    href="/settings"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition duration-150 ease-in-out"
                  >
                    Settings
                  </Link>
                  <SignOutButton />
                </div>
              </div>
              <MobileMenu />
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

