import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = (cookieStore = cookies()) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // 确保cookieStore是同步的，而不是Promise
          const cookieObj = typeof cookieStore.get === 'function' 
            ? cookieStore.get(name) 
            : undefined
          return cookieObj?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          if (typeof cookieStore.set === 'function') {
            cookieStore.set({ name, value, ...options })
          }
        },
        remove(name: string, options: Record<string, unknown>) {
          if (typeof cookieStore.set === 'function') {
            cookieStore.set({ name, value: '', ...options })
          }
        },
      },
    }
  )
}