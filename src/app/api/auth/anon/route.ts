import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient()
    
    // Sign in anonymously
    const { data, error } = await supabase.auth.signInAnonymously()
    
    if (error) {
      console.error('Anonymous sign in error:', error)
      return NextResponse.json(
        { error: 'Failed to sign in anonymously' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Signed in anonymously',
        user: data.user
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error during anonymous sign in:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}