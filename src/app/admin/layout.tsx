'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LayoutDashboard, Gamepad2, Tag, ClipboardList, Users, LogOut, FileText } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // 检查cookie中的session
    const checkAuth = async () => {
      try {
        // 已经在中间件中处理了身份验证，如果能访问到这个页面，说明已经通过了验证
        setAuthenticated(true)
      } catch (error) {
        console.error('验证错误:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    // 清除session cookie
    document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!authenticated) {
    return null
  }

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black">
      <div className="flex flex-col md:flex-row">
        {/* 侧边导航 */}
        <aside className="w-full md:w-64 bg-black/50 backdrop-blur-lg border-r border-blue-500/20 md:min-h-screen">
          <div className="p-4 border-b border-blue-500/20">
            <Link href="/" className="text-2xl font-bold text-white">
              Game<span className="text-blue-500">Club</span>
            </Link>
            <p className="text-sm text-blue-400 mt-1">管理后台</p>
          </div>
          
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/admin/dashboard" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive('/admin/dashboard') 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-blue-900/50 hover:text-white'
                  }`}
                >
                  <LayoutDashboard size={18} />
                  <span>仪表盘</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/games" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive('/admin/games') 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-blue-900/50 hover:text-white'
                  }`}
                >
                  <Gamepad2 size={18} />
                  <span>游戏管理</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/categories" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive('/admin/categories') 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-blue-900/50 hover:text-white'
                  }`}
                >
                  <Tag size={18} />
                  <span>分类管理</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/logs" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive('/admin/logs') 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-blue-900/50 hover:text-white'
                  }`}
                >
                  <FileText size={18} />
                  <span>操作日志</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/admin/users" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive('/admin/users') 
                      ? 'bg-blue-600 text-white' 
                      : 'text-blue-300 hover:bg-blue-900/50 hover:text-white'
                  }`}
                >
                  <Users size={18} />
                  <span>人员管理</span>
                </Link>
              </li>
            </ul>
            
            <div className="mt-8 pt-4 border-t border-blue-500/20">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={18} />
                <span>退出登录</span>
              </button>
            </div>
          </nav>
        </aside>
        
        {/* 主内容区 */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}