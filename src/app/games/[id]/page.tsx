import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'

// 从数据库获取游戏数据
async function getGameData(id: string) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // 检查ID是否为有效的UUID格式
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    
    // 如果不是UUID格式，尝试获取热门游戏列表
    if (!isValidUUID && /^\d+$/.test(id)) {
      const index = parseInt(id) - 1;
      if (index >= 0) {
        const { data: popularGames } = await supabase
          .from('games')
          .select('id')
          .order('views', { ascending: false })
          .limit(20);
          
        if (popularGames && popularGames.length > index) {
          id = popularGames[index].id;
          console.log(`转换数字ID ${index + 1} 到UUID: ${id}`);
        }
      }
    }
    
    // 直接使用传入的ID查询游戏
    const { data: game, error } = await supabase
      .from('games')
      .select('*, categories(name)')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching game:', error);
      return null;
    }
    
    if (!game) {
      console.error('Game not found');
      return null;
    }
    
    // 获取相关游戏推荐（同类别的其他游戏）
    let relatedGames = [];
    try {
      const { data } = await supabase
        .from('games')
        .select('*, categories(name)')
        .eq('category_id', game.category_id)
        .neq('id', id)
        .limit(4);
      
      relatedGames = data || [];
    } catch (err) {
      console.error('Error fetching related games:', err);
    }
    
    // 尝试记录游戏浏览量 - 忽略错误以避免影响页面加载
    try {
      // 直接更新游戏浏览量
      const { error: updateError } = await supabase
        .from('games')
        .update({ views: supabase.sql`views + 1` })
        .eq('id', id);
      
      if (updateError) {
        console.error('Error updating game views:', updateError);
      }
    } catch (viewError) {
      // 提供更详细的错误信息
      console.error('Error setting up view tracking:', viewError instanceof Error ? viewError.message : viewError);
    }
    
    return {
      game: {
        ...game,
        category_name: game.categories?.name
      },
      relatedGames: relatedGames?.map(relatedGame => ({
        ...relatedGame,
        category_name: relatedGame.categories?.name
      })) || []
    }
  } catch (error) {
    console.error('Error in getGameData:', error);
    throw error; // 抛出错误，让调用者处理
  }
}

// 游戏卡片组件
function GameCard({ game }: { game: any }) {
  return (
    <Link href={`/games/${game.id}`} className="group">
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
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
            {game.title}
          </h3>
          <p className="mt-1 text-sm text-blue-300 line-clamp-2">
            {game.description}
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

export default async function GamePage({ params }: { params: { id: string } }) {
  const gameData = await getGameData(params.id);
  
  if (!gameData) {
    notFound();
  }
  
  if (!gameData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  if (!gameData) {
    notFound()
  }
  
  const { game, relatedGames } = gameData
  
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
      
      {/* 游戏详情 */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* 游戏主内容 */}
          <div className="w-full lg:w-2/3">
            {/* 游戏标题 */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{game.title}</h1>
            
            {/* 游戏分类和浏览量 */}
            <div className="flex items-center gap-4 mb-6">
              <span className="inline-block rounded bg-blue-600 px-3 py-1 text-sm text-white">
                {game.category_name}
              </span>
              <span className="text-sm text-blue-300">{game.views || 0} 次浏览</span>
            </div>
            
            {/* 游戏iframe */}
             <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-blue-500/30 bg-black mb-8">
               {game.game_url ? (
                 <iframe 
                   src={game.game_url} 
                   title={game.title}
                   className="absolute inset-0 w-full h-full"
                   allowFullScreen
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 ></iframe>
               ) : (
                 <div className="absolute inset-0 flex items-center justify-center bg-blue-900/30">
                   <p className="text-blue-300 text-center px-4">
                     游戏链接不可用<br />
                     <span className="text-sm opacity-70">请检查游戏URL是否正确</span>
                   </p>
                 </div>
               )}
             </div>
            
            {/* 游戏详情 */}
            <div className="bg-black/50 backdrop-blur-lg border border-blue-500/20 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-4">游戏详情</h2>
              
              {/* 游戏描述（支持HTML内容） */}
              {game.description ? (
                <div 
                  className="text-blue-300 game-description"
                  dangerouslySetInnerHTML={{ __html: game.description }}
                />
              ) : (
                <p className="text-blue-300">暂无游戏描述</p>
              )}
            </div>
          </div>
          
          {/* 侧边栏 */}
          <div className="w-full lg:w-1/3">
            {/* 广告位 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 mb-8 text-center">
              <p className="text-white font-bold mb-2">广告位</p>
              <p className="text-white/80 text-sm">这里可以放置广告内容</p>
            </div>
            
            {/* 相关游戏推荐 */}
            <div className="bg-black/50 backdrop-blur-lg border border-blue-500/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">相关游戏推荐</h2>
              <div className="space-y-4">
                {relatedGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 页脚 */}
      <footer className="bg-black/70 border-t border-blue-500/20 py-8 px-4 mt-12">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Link href="/" className="text-xl font-bold text-white">
                Game<span className="text-blue-500">Club</span>
              </Link>
              <p className="mt-2 text-sm text-blue-400">
                © {new Date().getFullYear()} GameClub. 保留所有权利。
              </p>
            </div>
            
            <div className="flex space-x-6">
              <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
                首页
              </Link>
              <Link href="/games" className="text-blue-400 hover:text-blue-300 transition-colors">
                游戏
              </Link>
              <Link href="/#about" className="text-blue-400 hover:text-blue-300 transition-colors">
                关于
              </Link>
              <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                登录
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}