'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function GamesPage() {
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const supabase = createClientComponentClient()
        
        // 获取所有游戏
        let query = supabase
          .from('games')
          .select('*, categories(name)')
          .order('created_at', { ascending: false })
          
        // 如果选择了特定分类，则过滤
        if (selectedCategory !== 'all') {
          query = query.eq('category_id', selectedCategory)
        }
        
        const { data: gamesData, error } = await query
        
        if (error) {
          console.error('Error fetching games:', error)
          return
        }
        
        // 获取所有分类
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .order('name')
          
        setGames(gamesData || [])
        setCategories(categoriesData || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchGames()
  }, [selectedCategory])
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 to-black">
      {/* 导航栏 */}
      <nav className="sticky top-0 z-10 backdrop-blur-lg bg-black/50 border-b border-blue-500/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            Game<span className="text-blue-500">Club</span>
          </Link>
          
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="text-white hover:text-blue-400 transition-colors">
              首页
            </Link>
            <Link href="/games" className="text-white hover:text-blue-400 transition-colors">
              全部游戏
            </Link>
            <Link href="/#about" className="text-white hover:text-blue-400 transition-colors">
              关于我们
            </Link>
          </div>
          
          <Link href="/login" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            登录
          </Link>
        </div>
      </nav>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">游戏列表</h1>
        
        {/* 分类筛选 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-md text-sm ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/50'
              }`}
            >
              全部
            </button>
            
            {categories.map((category: any) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-md text-sm ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-900/30 text-blue-300 hover:bg-blue-800/50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-blue-400">加载中...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game: any) => (
              <Link href={`/games/${game.id}`} key={game.id} className="group">
                <div className="relative overflow-hidden rounded-lg border border-blue-500/20 bg-black/50 transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
                  <div className="aspect-video relative overflow-hidden">
                    {game.cover_url ? (
                      <Image 
                        src={game.cover_url} 
                        alt={game.title} 
                        fill 
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-900/50">
                        <span className="text-blue-300">游戏封面</span>
                      </div>
                    )}
                    {game.featured && (
                      <div className="absolute top-2 right-2 bg-blue-600 px-2 py-1 text-xs font-medium text-white rounded">
                        热门
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                      {game.title}
                    </h3>
                    <p className="mt-1 text-sm text-blue-300 line-clamp-2">
                      {game.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-block rounded bg-blue-900/50 px-2 py-1 text-xs text-blue-300">
                        {game.categories?.name}
                      </span>
                      <span className="text-xs text-blue-400">{game.views || 0} 次浏览</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            {games.length === 0 && (
              <div className="col-span-full text-center py-12 text-blue-300">
                没有找到符合条件的游戏
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}