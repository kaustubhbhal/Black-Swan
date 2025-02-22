"use client"

import { useState, type ReactNode } from "react"
import { Menu, X } from "lucide-react"

interface MobileMenuProps {
  children: ReactNode
}

export default function MobileMenu({ children }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
      >
        <span className="sr-only">Open main menu</span>
        {isOpen ? (
          <X className="block h-6 w-6" aria-hidden="true" />
        ) : (
          <Menu className="block h-6 w-6" aria-hidden="true" />
        )}
      </button>

      <div
        className={`${
          isOpen ? "block" : "hidden"
        } fixed inset-0 z-50 bg-black bg-opacity-90 backdrop-blur-sm transition-opacity duration-300 ease-in-out`}
      >
        <div className="flex justify-end p-4">
          <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-300 focus:outline-none">
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center h-full">{children}</div>
      </div>
    </div>
  )
}

