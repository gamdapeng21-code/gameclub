'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  
  useEffect(() => {
    fetchLogs()
  }, [])
  
  async function fetchLogs() {
    setLoading(true)
    
    try {
      // 检查表是否存在
      const { error: checkError } = await supabase
        .from('operation_logs')
        .select('id')
        .limit(1)
        .single()
      
      if (checkError && checkError.code === '42P01') {
        console.log('操作日志表不存在，显示空数据')
        setLogs([])
        setLoading(false)
        return
      }
      
      const { data, error } = await supabase
        .from('operation_logs')
        .select(`
          id,
          user_id,
          operation_type,
          target_table,
          target_id,
          details,
          ip_address,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) {
        console.error('Error fetching logs:', error)
      } else {
        setLogs(data || [])
      }
    } catch (err) {
      console.error('Exception fetching logs:', err)
    }
    
    setLoading(false)
  }
  
  function formatDate(dateString: string) {
    try {
      return new Date(dateString).toLocaleString('zh-CN')
    } catch (e) {
      return dateString
    }
  }
  
  function getOperationTypeClass(type: string) {
    switch (type?.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800'
      case 'update':
        return 'bg-blue-100 text-blue-800'
      case 'delete':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">操作日志</h1>
      
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={fetchLogs}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          刷新日志
        </button>
        
        <div className="text-sm text-gray-500">
          提示：操作日志功能已实现，需要应用数据库迁移后才能正常显示数据
        </div>
      </div>
      
      {/* 日志表格 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">暂无操作日志</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">目标表</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">目标ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP地址</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">详情</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getOperationTypeClass(log.operation_type)}`}>
                      {log.operation_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.target_table}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="font-mono">{log.target_id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.ip_address || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => alert(JSON.stringify(log.details, null, 2))}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}