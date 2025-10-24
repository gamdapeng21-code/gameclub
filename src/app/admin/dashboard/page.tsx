'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Gamepad2, Tag, Eye, Calendar, TrendingUp, BarChart3 } from 'lucide-react'
import dynamic from 'next/dynamic'

// 使用dynamic导入recharts组件，禁用SSR
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false })
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false })

// 定义游戏类型
interface Game {
  id: string;
  title: string;
  created_at?: string;
  views: number;
  category_id?: string;
  categories: {
    name: string;
  }[];
}

// 定义热门游戏类型
interface TopGame {
  id: string;
  title: string;
  views: number;
  categories: {
    name: string;
  }[];
}

// 定义趋势数据类型
interface TrendData {
  name: string;
  views: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<{
    totalGames: number;
    totalCategories: number;
    totalViews: number;
    recentGames: Game[];
    topGames: TopGame[];
    viewsTrend: TrendData[];
  }>({
    totalGames: 0,
    totalCategories: 0,
    totalViews: 0,
    recentGames: [],
    topGames: [],
    viewsTrend: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week') // 'week', 'month', 'year'
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 获取游戏总数
        const { count: gamesCount } = await supabase
          .from('games')
          .select('*', { count: 'exact', head: true })

        // 获取分类总数
        const { count: categoriesCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })

        // 获取总浏览量
        const { data: viewsData } = await supabase
          .from('games')
          .select('views')
        
        const totalViews = viewsData?.reduce((sum, game) => sum + (game.views || 0), 0) || 0

        // 获取最近添加的游戏
        const { data: recentGames } = await supabase
          .from('games')
          .select('id, title, created_at, views, category_id, categories(name)')
          .order('created_at', { ascending: false })
          .limit(5)
          
        // 获取浏览量最高的游戏
        const { data: topGames } = await supabase
          .from('games')
          .select('id, title, views, categories(name)')
          .order('views', { ascending: false })
          .limit(5)
          
        // 获取真实的浏览量趋势数据
        let viewsTrend = []
        
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
          viewsTrend = result.data.map((item: any) => ({
            name: formatDate(new Date(item.view_date), timeRange),
            views: item.total_views
          }))
        } else {
          // 如果API调用失败，使用备用数据
          viewsTrend = generateBackupTrendData(timeRange)
        }

        setStats({
          totalGames: gamesCount || 0,
          totalCategories: categoriesCount || 0,
          totalViews,
          recentGames: recentGames || [],
          topGames: topGames || [],
          viewsTrend
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase, timeRange])
  
  // 格式化日期
  const formatDate = (date: Date, range: string) => {
    if (range === 'year') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    } else {
      return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }
  }
  
  // 生成备用趋势数据（仅在API调用失败时使用）
  const generateBackupTrendData = (range: string) => {
    const data = []
    let days = 7
    
    if (range === 'month') {
      days = 30
    } else if (range === 'year') {
      days = 12
    }
    
    for (let i = 0; i < days; i++) {
      const date = new Date()
      if (range === 'year') {
        date.setMonth(date.getMonth() - (days - i - 1))
        data.push({
          name: formatDate(date, range),
          views: Math.floor(Math.random() * 1000) + 500
        })
      } else {
        date.setDate(date.getDate() - (days - i - 1))
        data.push({
          name: formatDate(date, range),
          views: Math.floor(Math.random() * 100) + 50
        })
      }
    }
    
    return data
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">仪表盘</h1>
        <p className="text-blue-400">
          {new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-6 rounded-xl border border-blue-500/20 backdrop-blur-sm shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm">游戏总数</p>
                  <h3 className="text-3xl font-bold text-white mt-2">{stats.totalGames}</h3>
                </div>
                <div className="bg-blue-500/20 p-3 rounded-lg">
                  <Gamepad2 className="text-blue-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-6 rounded-xl border border-purple-500/20 backdrop-blur-sm shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-sm">分类总数</p>
                  <h3 className="text-3xl font-bold text-white mt-2">{stats.totalCategories}</h3>
                </div>
                <div className="bg-purple-500/20 p-3 rounded-lg">
                  <Tag className="text-purple-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 p-6 rounded-xl border border-cyan-500/20 backdrop-blur-sm shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-400 text-sm">总浏览量</p>
                  <h3 className="text-3xl font-bold text-white mt-2">{stats.totalViews.toLocaleString()}</h3>
                </div>
                <div className="bg-cyan-500/20 p-3 rounded-lg">
                  <Eye className="text-cyan-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* 游戏浏览数据走势图 */}
          <div className="bg-black/30 rounded-xl border border-blue-500/20 backdrop-blur-sm shadow-lg overflow-hidden mb-6">
            <div className="p-6 border-b border-blue-500/20 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">游戏浏览数据走势</h2>
              <div className="flex space-x-2">
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
            </div>
            <div className="p-6" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats.viewsTrend}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#93c5fd" 
                    tick={{ fill: '#93c5fd' }}
                  />
                  <YAxis 
                    stroke="#93c5fd"
                    tick={{ fill: '#93c5fd' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                      borderColor: '#3b82f6',
                      color: '#fff' 
                    }}
                    labelStyle={{ color: '#93c5fd' }}
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
          </div>
          
          {/* 热门游戏排行 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-black/30 rounded-xl border border-blue-500/20 backdrop-blur-sm shadow-lg overflow-hidden">
              <div className="p-6 border-b border-blue-500/20">
                <h2 className="text-xl font-bold text-white">热门游戏排行</h2>
              </div>
              <div className="p-4">
                {stats.topGames.length > 0 ? (
                  <div style={{ height: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.topGames.map(game => ({
                          name: game.title.length > 10 ? game.title.substring(0, 10) + '...' : game.title,
                          views: game.views || 0
                        }))}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" />
                        <XAxis 
                          type="number" 
                          stroke="#93c5fd"
                          tick={{ fill: '#93c5fd' }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          stroke="#93c5fd"
                          tick={{ fill: '#93c5fd' }}
                          width={100}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                            borderColor: '#8b5cf6',
                            color: '#fff' 
                          }}
                        />
                        <Bar 
                          dataKey="views" 
                          name="浏览量" 
                          fill="#8b5cf6" 
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-blue-400 py-8">暂无游戏数据</p>
                )}
              </div>
            </div>
            
            {/* 最近添加的游戏 */}
            <div className="bg-black/30 rounded-xl border border-blue-500/20 backdrop-blur-sm shadow-lg overflow-hidden">
              <div className="p-6 border-b border-blue-500/20">
                <h2 className="text-xl font-bold text-white">最近添加的游戏</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-900/30">
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">游戏名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">分类</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">浏览量</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-500/10">
                    {stats.recentGames.length > 0 ? (
                      stats.recentGames.map((game: any) => (
                        <tr key={game.id} className="hover:bg-blue-900/20 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{game.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300">{game.categories?.name || '未分类'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300">{game.views || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-blue-400">暂无游戏数据</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}