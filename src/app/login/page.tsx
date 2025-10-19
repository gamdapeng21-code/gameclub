'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
// 移除不必要的Supabase客户端导入，因为我们使用自定义API
// import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 使用自定义API登录
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '登录失败')
      }

      // 登录成功，重定向到管理后台
      router.push('/admin/dashboard')
      router.refresh()
    } catch (error: any) {
      console.error('登录错误:', error.message)
      setError(error.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
      <div className="w-full max-w-md p-8 space-y-8 bg-black/50 backdrop-blur-lg rounded-xl border border-blue-500/20 shadow-2xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">游戏门户管理系统</h1>
          <p className="mt-2 text-blue-400">请登录以访问管理后台</p>
        </div>
        
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-md text-red-200 text-sm">
            {error}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-blue-300">
                账号
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-blue-900/30 border border-blue-700 rounded-md text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-blue-300">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-3 bg-blue-900/30 border border-blue-700 rounded-md text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
  )
}