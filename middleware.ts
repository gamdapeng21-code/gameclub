import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 获取会话cookie
  const sessionCookie = request.cookies.get('session')
  
  // 检查是否访问管理后台路径
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 如果没有会话cookie，重定向到登录页面
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    try {
      // 解析会话数据
      const sessionData = JSON.parse(sessionCookie.value)
      
      // 简单检查是否有admin角色
      if (!sessionData.user || sessionData.user.role !== 'admin') {
        // 非管理员用户，重定向到登录页面
        return NextResponse.redirect(new URL('/login', request.url))
      }
    } catch (error) {
      // 会话数据无效，重定向到登录页面
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}