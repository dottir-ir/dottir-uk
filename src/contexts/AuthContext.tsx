import React, { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { User } from '../types'
import toast from 'react-hot-toast'
import { authService } from '../services/api/authService'
import { getDeviceInfo } from '../utils/auth'

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  role: 'doctor' | 'patient' | 'admin'
  is_verified: boolean
  verification_document_url?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: SupabaseUser | null
  currentUser: User | null
  currentProfile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, profile: Partial<Profile>) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (profile: Partial<Profile>) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  resetPassword: (password: string) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  uploadVerificationDocument: (file: File) => Promise<string>
  resendVerification: () => Promise<void>
  requiresMFA: boolean
  verifyMFA: (code: string) => Promise<void>
  cancelMFA: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [requiresMFA, setRequiresMFA] = useState(false)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      setSession(session)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setCurrentUser(null)
        setCurrentProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      // Fetch user for MFA status
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('mfa_enabled')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      if (profile) {
        setCurrentUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          avatar: profile.avatar,
          specialty: profile.specialty,
          bio: profile.bio,
          location: profile.location,
          specialization: profile.specialization,
          joinedAt: profile.joined_at,
          lastActive: profile.last_active,
          isVerified: profile.is_verified,
          verificationDocumentUrl: profile.verification_document_url,
          mfa_enabled: userData?.mfa_enabled ?? false,
        });
        setCurrentProfile(profile as Profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setCurrentUser(null);
      setCurrentProfile(null);
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign in')
      throw err
    }
  }

  const signUp = async (email: string, password: string, profile: Partial<Profile>) => {
    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError
      if (!user) throw new Error('No user returned from sign up')

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user.id,
            ...profile,
            is_verified: false,
          },
        ])

      if (profileError) throw profileError
      toast.success('Account created successfully! Please check your email for verification.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create account')
      throw err
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to sign out')
      throw err
    }
  }

  const updateProfile = async (profile: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in')

    try {
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user.id)

      if (error) throw error

      await fetchProfile(user.id)
      toast.success('Profile updated successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
      throw err
    }
  }

  const updatePassword = async (newPassword: string) => {
    if (!user) throw new Error('No user logged in')

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error
      toast.success('Password updated successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password')
      throw err
    }
  }

  const resetPassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error
      toast.success('Password updated successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password')
      throw err
    }
  }

  const verifyEmail = async (token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      })

      if (error) throw error

      // Update profile verification status
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', user.id)

        if (profileError) throw profileError
        await fetchProfile(user.id)
      }
      toast.success('Email verified successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to verify email')
      throw err
    }
  }

  const uploadVerificationDocument = async (file: File): Promise<string> => {
    if (!user) throw new Error('No user logged in')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-verification.${fileExt}`
      const filePath = `verification-documents/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      await updateProfile({ verification_document_url: publicUrl })
      return publicUrl
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload verification document')
      throw err
    }
  }

  const resendVerification = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user?.email || '',
      })

      if (error) throw error
      toast.success('Verification email sent. Please check your inbox.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend verification email')
      throw err
    }
  }

  const verifyMFA = async (code: string) => {
    if (!pendingUserId) return

    try {
      const isValid = await authService.verifyMFA(pendingUserId, code)
      
      if (isValid) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', pendingUserId)
          .single()

        if (userError) throw userError

        setUser(userData)
        setRequiresMFA(false)
        setPendingUserId(null)

        // Create new session
        await authService.createSession(
          pendingUserId,
          getDeviceInfo(),
          await getClientIP()
        )
      } else {
        toast.error('Invalid verification code')
      }
    } catch (error: any) {
      toast.error(error.message)
      throw error
    }
  }

  const cancelMFA = () => {
    setRequiresMFA(false)
    setPendingUserId(null)
    signOut()
  }

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch (error) {
      console.error('Error fetching IP:', error)
      return 'unknown'
    }
  }

  const value = {
    user,
    currentUser,
    currentProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updatePassword,
    resetPassword,
    verifyEmail,
    uploadVerificationDocument,
    resendVerification,
    requiresMFA,
    verifyMFA,
    cancelMFA,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}