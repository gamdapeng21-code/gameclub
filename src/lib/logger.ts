// 注意：此文件只包含客户端可用的日志功能
import { safeAsync, AppError } from './errorHandler';

export type LogOperation = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'other'

export interface LogParams {
  userId?: string // 改为可选，避免外键约束错误
  operationType: LogOperation
  targetTable: string
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string
}

// 客户端版本的日志记录函数
export async function logOperationClient(params: LogParams): Promise<{success: boolean, data?: Record<string, unknown>, error?: AppError}> {
  // 验证必要参数
  if (!params.operationType || !params.targetTable) {
    return {
      success: false,
      error: {
        message: '操作类型和目标表是必填字段',
        code: 'VALIDATION_ERROR'
      }
    };
  }

  // 使用safeAsync包装异步操作
  const [result, error] = await safeAsync(async () => {
    console.log('记录操作日志:', params);
    
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`日志记录失败: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('日志记录成功:', data);
    return data;
  }, undefined, '客户端日志记录');
  
  if (error) {
    return {
      success: false,
      error
    };
  }
  
  return {
    success: true,
    data: result
  };
}