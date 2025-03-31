"use client"

import MusicPlayer from "@/components/music-player"
import { ThemeProvider } from "next-themes"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-zinc-900 dark:to-black text-gray-900 dark:text-white">
        <div className="container mx-auto py-8 px-4">
          <MusicPlayer />
        </div>
      </main>
    </ThemeProvider>
  )
}