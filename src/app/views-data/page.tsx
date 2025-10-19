'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// 导出配置，告诉Next.js这个页面需要客户端渲染
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default function ViewsDataPage() {
  const [gamesList, setGamesList] = useState<any[]>([])
  const [viewsTrend, setViewsTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week') // 'week', 'month', 'year'
  const supabase = createClient()

  // 格式化日期
  const formatDate = (date: Date, range: string) => {
    if (range === 'week') {
      return `${date.getMonth() + 1}/${date.getDate()}`
    } else if (range === 'month') {
      return `${date.getMonth() + 1}/${date.getDate()}`
    } else {
      return `${date.getMonth() + 1}月`
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // 获取游戏列表
        const { data: games } = await supabase
          .from('games')
          .select('id, title, views')
          .order('views', { ascending: false })
        
        setGamesList(games || [])
        
        // 确定要获取的天数
        let days = 7
        if (timeRange === 'month') {
          days = 30
        } else if (timeRange === 'year') {
          days = 365
        }
        
        // 从API获取浏览量趋势数据
        const response = await fetch(`/api/game-views?days=${days}`)
        if (response.ok) {
          const result = await response.json()
          const trend = result.data.map((item: any) => ({
            name: formatDate(new Date(item.view_date), timeRange),
            views: item.total_views
          }))
          setViewsTrend(trend)
          console.log('浏览量趋势数据:', trend)
        } else {
          console.error('获取浏览量趋势数据失败')
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, timeRange])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">游戏浏览数据</h1>
      
      <div className="mb-6">
        <div className="flex space-x-2 mb-4">
          <button 
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1 rounded-md text-sm ${timeRange === 'week' 
              ? 'bg-blue-600 text-white' 
              : 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/50'}`}
          >
            周
          </button>
          <button 
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1 rounded-md text-sm ${timeRange === 'month' 
              ? 'bg-blue-600 text-white' 
              : 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/50'}`}
          >
            月
          </button>
          <button 
            onClick={() => setTimeRange('year')}
            className={`px-3 py-1 rounded-md text-sm ${timeRange === 'year' 
              ? 'bg-blue-600 text-white' 
              : 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/50'}`}
          >
            年
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-10">加载中...</div>
        ) : (
          <div className="bg-black/30 rounded-xl border border-blue-500/20 backdrop-blur-sm shadow-lg p-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={viewsTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" />
                <XAxis dataKey="name" stroke="#93c5fd" />
                <YAxis stroke="#93c5fd" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                    borderColor: '#3b82f6',
                    color: '#fff' 
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  name="浏览量" 
                  stroke="#3b82f6" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">游戏浏览量列表</h2>
        <div className="bg-black/30 rounded-xl border border-blue-500/20 backdrop-blur-sm shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-blue-500/20">
            <thead className="bg-blue-900/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">游戏名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-300 uppercase tracking-wider">浏览量</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-500/20">
              {gamesList.map((game: any) => (
                <tr key={game.id} className="hover:bg-blue-900/20">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">{game.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-100">{game.views || 0}</td>
                </tr>
              ))}
              {gamesList.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-center text-sm text-blue-300">暂无数据</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 text-sm text-blue-400">
        <p>数据来源: game_views 表和 games 表</p>
        <p>更新时间: {new Date().toLocaleString()}</p>
      </div>
    </div>
  )
}