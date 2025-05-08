import { Button } from "@/components/ui/button"
import { BookOpen, GraduationCap, Users, BookText } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { PageTransition } from "@/components/page-transition"
import { FeatureCard } from "@/components/feature-card"

export default function Home() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
        <header className="container mx-auto py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">EduTrack</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto py-12">
          <section className="py-12 md:py-24 lg:py-32 flex flex-col items-center text-center">
            <div className="space-y-4 max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">Student Management System</h1>
              <p className="text-xl text-muted-foreground max-w-[700px] mx-auto">
                A comprehensive platform for educational institutions to manage students, courses, grades, and more.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<GraduationCap className="h-10 w-10" />}
              title="Course Management"
              description="Create, edit, and manage courses with ease. Assign teachers and enroll students."
            />
            <FeatureCard
              icon={<Users className="h-10 w-10" />}
              title="Student Tracking"
              description="Monitor student progress, attendance, and performance with detailed analytics."
            />
            <FeatureCard
              icon={<BookText className="h-10 w-10" />}
              title="Assignment Management"
              description="Create assignments, grade submissions, and provide feedback to students."
            />
          </section>
        </main>

        <footer className="border-t bg-muted/50">
          <div className="container mx-auto py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="font-semibold">EduTrack</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} EduTrack. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  )
}
