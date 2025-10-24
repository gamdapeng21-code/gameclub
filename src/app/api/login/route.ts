import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

// 简化的登录API，只校验admin/admin
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    
    // 简化的账号验证，只需要admin/admin
    if (username === 'admin' && password === 'admin') {
      // 创建简单的会话cookie
      const sessionData = {
        user: {
          role: 'admin'
        }
      }
      
      // 创建响应对象
      const response = NextResponse.json({ 
        success: true
      })
      
      // 设置简单的cookie
      response.cookies.set({
        name: 'session',
        value: JSON.stringify(sessionData),
        path: '/'
      })
      
      return response
    } else {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('登录API错误:', error)
    return NextResponse.json(
      { error: '登录处理失败' },
      { status: 500 }
    )
  }
}