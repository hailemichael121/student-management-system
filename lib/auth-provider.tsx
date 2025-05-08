"use client"

import type React from "react"

import { createContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import type { Session, User } from "@supabase/supabase-js"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, userData: any) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (data: any) => Promise<any>
  refreshProfile: () => Promise<void>
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
  updateProfile: async () => ({}),
  refreshProfile: async () => {},
  globalLoading: false,
  setGlobalLoading: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const [globalLoading, setGlobalLoading] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }

      // Show toast notifications for auth events
      if (event === "SIGNED_IN") {
        toast({
          title: "Signed in successfully",
          description: "Welcome back!",
        })
      } else if (event === "SIGNED_OUT") {
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        })
      } else if (event === "USER_UPDATED") {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [toast])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error) {
        throw error
      }

      setProfile(data)
    } catch (error: any) {
      console.error("Error fetching profile:", error.message)
      toast({
        title: "Error",
        description: "Failed to load user profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    await fetchProfile(user.id)
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      return data
    } catch (error: any) {
      console.error("Error signing in:", error.message)
      toast({
        title: "Authentication failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      })
      throw error
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        throw authError
      }

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role,
          student_id: userData.role === "student" ? userData.studentId : null,
          email: email,
        })

        if (profileError) {
          throw profileError
        }

        // Create welcome notification
        await supabase.from("notifications").insert({
          user_id: authData.user.id,
          title: "Welcome to EduTrack!",
          message: "Thank you for joining our platform. Get started by exploring your dashboard.",
          type: "welcome",
          read: false,
        })

        toast({
          title: "Account created",
          description: "Your account has been created successfully.",
        })
      }

      return authData
    } catch (error: any) {
      console.error("Error signing up:", error.message)
      toast({
        title: "Registration failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      })
      throw error
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error: any) {
      console.error("Error signing out:", error.message)
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const updateProfile = async (data: any) => {
    if (!user) return null

    try {
      const { error } = await supabase.from("profiles").update(data).eq("id", user.id)

      if (error) {
        throw error
      }

      // Refresh the profile data
      await fetchProfile(user.id)

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      return profile
    } catch (error: any) {
      console.error("Error updating profile:", error.message)
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
        globalLoading,
        setGlobalLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
