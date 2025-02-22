import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import NavbarWrapper from "@/components/ui/NavbarWrapper"
import AuthProvider from "./AuthProvider"
import { ThemeProvider } from "./contexts/ThemeContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "BlackSwan - Portfolio Stress Test",
  description: "Test your portfolio against black-swan events",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground`}>
        <AuthProvider>
          <ThemeProvider>
            <div className="flex flex-col min-h-screen">
              <NavbarWrapper />
              <main className="flex-grow">
                <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">{children}</div>
              </main>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

