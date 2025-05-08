"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Book } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDark = theme === "dark"

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative overflow-hidden rounded-full"
    >
      <div className="relative h-5 w-5">
        {/* Sun */}
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 0 : 1,
            opacity: isDark ? 0 : 1,
            rotate: isDark ? -30 : 0,
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Sun className="h-5 w-5" />
        </motion.div>

        {/* Moon */}
        <motion.div
          initial={false}
          animate={{
            scale: isDark ? 1 : 0,
            opacity: isDark ? 1 : 0,
            rotate: isDark ? 0 : 30,
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Moon className="h-5 w-5" />
        </motion.div>
      </div>

      {/* Book animation */}
      <motion.div
        initial={false}
        animate={{
          x: isDark ? [0, 10, 10] : [0, -10, -10],
          y: isDark ? [0, -10, 0] : [0, 10, 0],
          opacity: [0, 1, 0],
          rotate: isDark ? [0, 20, 0] : [0, -20, 0],
        }}
        transition={{
          duration: 0.6,
          times: [0, 0.5, 1],
          ease: "easeInOut",
        }}
        className="absolute -top-1 -right-1 z-10"
      >
        <Book className="h-3 w-3 text-primary" />
      </motion.div>

      {/* Background animation */}
      <motion.div
        initial={false}
        animate={{
          opacity: isDark ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-20"
      />

      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
