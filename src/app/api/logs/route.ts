import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { handleApiError, safeAsync } from '@/lib/errorHandler'

export const runtime = 'edge'
export const dynamic = 'force-static'

export async function POST(request: NextRequest) {
  // 使用safeAsync包装整个函数逻辑
  const [result, error] = await safeAsync(async () => {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // 获取当前用户
    const { data: { user } } = await supabase.auth.getUser()
    
    // 安全解析请求体
    let body;
    try {
      body = await request.json()
    } catch (e) {
      throw new Error('无效的请求格式，请提供有效的JSON数据')
    }
    
    const { userId, operationType, targetTable, targetId, details } = body
    
    // 验证必要字段
    if (!operationType || !targetTable) {
      throw new Error('操作类型和目标表是必填字段')
    }
    
    // 打印接收到的数据，用于调试
    console.log('接收到日志请求:', { userId, operationType, targetTable, targetId })
    
    // 获取IP地址
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '未知'
    
    // 直接使用SQL插入记录，避免RPC调用可能的问题
    // 注意：如果没有有效的用户ID，则不设置user_id字段（它将为null）
    const insertData: Record<string, any> = {
      operation_type: operationType,
      target_table: targetTable,
      target_id: targetId,
      details: details,
      ip_address: ipAddress
    };
    
    // 只有当用户ID存在且有效时才添加到插入数据中
    if (userId && userId !== '00000000-0000-0000-0000-000000000000') {
      insertData['user_id'] = userId;
    } else if (user) {
      insertData['user_id'] = user.id;
    }
    
    const { data, error } = await supabase
      .from('operation_logs')
      .insert(insertData)
      .select('id')
    
    console.log('日志记录结果:', { success: !error, error, data });
    
    if (error) {
      throw new Error(`日志记录失败: ${error.message}`)
    }
    
    return { success: true, logId: data }
  }, undefined, '日志API');
  
  // 处理错误或返回成功结果
  if (error) {
    return handleApiError(error, '日志API')
  }
  
  return NextResponse.json(result)
}