import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

// 游戏卡片组件
function GameCard({ game }: { game: any }) {
  return (
    <Link href={`/games/${game.id}`} className="group" prefetch={true}>
      <div className="relative overflow-hidden rounded-lg border border-blue-500/20 bg-black/50 transition-all duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
        <div className="aspect-video relative overflow-hidden">
          {game.cover_url ? (
            <Image 
              src={game.cover_url} 
              alt={game.title} 
              fill 
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="eager"
              priority={game.featured}
              fetchPriority={game.featured ? "high" : "auto"}
              quality={game.featured ? 90 : 75}
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
          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
            {game.title}
          </h3>
          <p className="mt-1 text-sm text-blue-300">
            {game.description?.substring(0, 100)}{game.description?.length > 100 ? '...' : ''}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="inline-block rounded bg-blue-900/50 px-2 py-1 text-xs text-blue-300">
              {game.category_name}
            </span>
            <span className="text-xs text-blue-400">{game.views || 0} 次浏览</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// 从数据库获取游戏数据
async function getGames() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  // 获取精选游戏
  const { data: featuredGames } = await supabase
    .from('games')
    .select('*, categories(name)')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(3);
  
  // 获取所有游戏
  const { data: allGames } = await supabase
    .from('games')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })
    .limit(6);
  
  // 获取所有分类
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  return {
    featuredGames: featuredGames?.map(game => ({
      ...game,
      category_name: game.categories?.name
    })) || [],
    allGames: allGames?.map(game => ({
      ...game,
      category_name: game.categories?.name
    })) || [],
    categories: categories || []
  };
}

import { redirect } from 'next/navigation';

export default async function HomePage() {
  // 重定向到游戏页面
  redirect('/games');
  
  // 以下代码不会执行，因为已经重定向
  const { featuredGames, allGames, categories } = await getGames();

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
      
      {/* 英雄区 */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            发现<span className="text-blue-500">精彩游戏</span>世界
          </h1>
          <p className="text-xl text-blue-300 mb-8 max-w-2xl mx-auto">
            探索我们精心挑选的游戏集合，找到适合你的下一个游戏冒险
          </p>
          
          {/* 搜索栏 */}
          <div className="max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="搜索游戏或分类..."
              className="w-full px-5 py-3 rounded-full bg-black/50 border border-blue-500/30 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </section>
      
      {/* 热门游戏 */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">热门游戏</h2>
            <Link href="/games" className="text-blue-400 hover:text-blue-300 transition-colors">
              查看全部 &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </section>
      
      {/* 全部游戏 */}
      <section className="py-12 px-4 bg-black/30">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-white mb-8">全部游戏</h2>
          
          {/* 分类标签 */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button className="px-3 py-1 rounded-full bg-blue-600 text-white text-sm">
              全部
            </button>
            {categories.map((category) => (
              <button 
                key={category.id} 
                className="px-3 py-1 rounded-full bg-blue-900/50 text-blue-300 text-sm hover:bg-blue-800/50 transition-colors"
              >
                {category.name}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {allGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </section>
      
      {/* 关于我们 */}
      <section id="about" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">关于我们</h2>
          
          <div className="bg-black/50 backdrop-blur-lg border border-blue-500/20 rounded-xl p-8">
            <p className="text-blue-300 mb-4">
              GameClub是一个致力于为玩家提供高质量游戏体验的在线平台。我们精心挑选各类游戏，让您可以轻松找到喜爱的游戏内容。
            </p>
            <p className="text-blue-300 mb-4">
              我们的使命是创建一个友好、便捷的游戏社区，让每一位玩家都能找到适合自己的游戏，享受游戏带来的乐趣。
            </p>
            <p className="text-blue-300">
              无论您是休闲玩家还是硬核游戏爱好者，GameClub都能满足您的需求。加入我们，开启您的游戏之旅！
            </p>
          </div>
        </div>
      </section>
      
      {/* 分类导航 */}
      <section className="py-12 px-4 bg-black/40">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">按分类浏览</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link 
                key={category.id}
                href={`/games?category=${category.id}`} 
                className="flex items-center p-3 rounded-lg bg-blue-900/30 border border-blue-500/20 hover:bg-blue-800/40 hover:border-blue-500/40 transition-all"
              >
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
                <span className="text-blue-200 font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* 常见问题 */}
      <section className="py-12 px-4 bg-black/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-white text-center mb-8">常见问题</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/20">
              <h3 className="text-lg font-semibold text-white mb-2">需要注册才能玩游戏吗？</h3>
              <p className="text-blue-300">不需要，您可以直接访问我们的网站并开始游戏，无需注册或下载任何软件。</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/20">
              <h3 className="text-lg font-semibold text-white mb-2">GameClub 是否安全？</h3>
              <p className="text-blue-300">是的，GameClub 对您和您的设备是安全的。我们不要求您下载任何文件，所有游戏都在浏览器中运行。</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/20">
              <h3 className="text-lg font-semibold text-white mb-2">如何找到我之前玩过的游戏？</h3>
              <p className="text-blue-300">您可以在&quot;全部游戏&quot;页面中搜索或浏览，也可以使用页面顶部的搜索功能快速找到您喜欢的游戏。</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* 页脚 */}
      <footer className="bg-black/80 border-t border-blue-500/20 pt-12 pb-8 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="text-2xl font-bold text-white">
                Game<span className="text-blue-500">Club</span>
              </Link>
              <p className="mt-4 text-sm text-blue-400">
                欢迎来到 GameClub - 免费在线游戏的中心！享受我们精选的浏览器游戏集合，无需下载，即刻开始游戏乐趣。
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">快速链接</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">首页</Link>
                </li>
                <li>
                  <Link href="/games" className="text-blue-400 hover:text-blue-300 transition-colors">全部游戏</Link>
                </li>
                <li>
                  <Link href="/#about" className="text-blue-400 hover:text-blue-300 transition-colors">关于我们</Link>
                </li>
                <li>
                  <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">登录</Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">热门分类</h3>
              <ul className="space-y-2">
                {categories.slice(0, 4).map((category) => (
                  <li key={category.id}>
                    <Link 
                      href={`/games?category=${category.id}`}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">联系我们</h3>
              <p className="text-blue-400 mb-2">有问题或建议？</p>
              <a href="mailto:contact@gameclub.com" className="text-blue-500 hover:text-blue-400 transition-colors">
                contact@gameclub.com
              </a>
              <div className="mt-4 flex space-x-4">
                <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-blue-500/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-blue-400 mb-4 md:mb-0">
              © {new Date().getFullYear()} GameClub. 保留所有权利。
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                隐私政策
              </Link>
              <Link href="/terms" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                使用条款
              </Link>
              <Link href="/cookies" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                Cookie 政策
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
