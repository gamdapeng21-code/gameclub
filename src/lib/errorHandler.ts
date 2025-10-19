/**
 * 统一错误处理工具
 * 提供全局错误处理函数和类型
 */

// 错误类型定义
export type ErrorDetails = Record<string, unknown>;

export type AppError = {
  message: string;
  code?: string;
  status?: number;
  details?: ErrorDetails;
};

// 创建标准化错误对象
export function createError(
  message: string,
  code?: string,
  status?: number,
  details?: ErrorDetails
): AppError {
  return {
    message,
    code,
    status,
    details,
  };
}

// 客户端错误处理函数
export function handleClientError(error: unknown, context?: string): AppError {
  console.error(`错误${context ? `(${context})` : ''}:`, error);
  
  // 已经是AppError类型
  if (error && typeof error === 'object' && 'message' in error) {
    return error as AppError;
  }
  
  // 处理常见错误类型
  if (error instanceof Error) {
    return createError(error.message, 'UNKNOWN_ERROR');
  }
  
  // 处理字符串错误
  if (typeof error === 'string') {
    return createError(error, 'STRING_ERROR');
  }
  
  // 处理未知错误类型
  return createError('发生未知错误', 'UNKNOWN_ERROR', 500, { rawError: String(error) });
}

// API响应错误处理
export function handleApiError(error: unknown, context?: string): Response {
  const appError = handleClientError(error, context);
  
  return new Response(
    JSON.stringify({ 
      error: appError.message,
      code: appError.code || 'UNKNOWN_ERROR',
      details: appError.details
    }),
    { 
      status: appError.status || 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// 异步操作包装器 - 用于包装异步函数，提供统一错误处理
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  errorHandler?: (error: AppError) => void,
  context?: string
): Promise<[T | null, AppError | null]> {
  try {
    const result = await asyncFn();
    return [result, null];
  } catch (error) {
    const appError = handleClientError(error, context);
    if (errorHandler) {
      errorHandler(appError);
    }
    return [null, appError];
  }
}