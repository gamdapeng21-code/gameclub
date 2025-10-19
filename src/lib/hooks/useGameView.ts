import { useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * 记录游戏浏览量的钩子函数
 * @param gameId 游戏ID
 * @param onViewRecorded 浏览量记录成功后的回调函数
 */
export function useGameView(
  gameId: number | string | null | undefined, 
  onViewRecorded?: () => void
) {
  // 使用ref来跟踪当前页面访问是否已记录
  const hasRecorded = useRef(false);
  
  useEffect(() => {
    // 如果没有游戏ID，则不记录浏览量
    if (!gameId) return
    
    // 重置记录状态，允许每次组件挂载时都记录浏览量
    hasRecorded.current = false;
    
    // 记录浏览量
    const recordView = async () => {
      // 防止在同一次组件生命周期内多次记录
      if (hasRecorded.current) return;
      
      try {
        // 直接使用Supabase客户端更新游戏浏览量
        const supabase = createClientComponentClient();
        
        // 先获取当前浏览量
        const { data: game } = await supabase
          .from('games')
          .select('views')
          .eq('id', gameId)
          .single();
          
        // 增加浏览量并更新
        const newViews = (game?.views || 0) + 1;
        const { error } = await supabase
          .from('games')
          .update({ views: newViews })
          .eq('id', gameId);
        
        if (!error) {
          // 标记本次已记录
          hasRecorded.current = true;
          console.log('游戏浏览量已直接更新:', gameId);
          
          // 不再调用回调函数，避免自动刷新
        } else {
          console.error('Error updating game view:', error);
        }
      } catch (error) {
        console.error('Failed to record game view:', error)
      }
    }
    
    // 直接记录浏览量，不使用延时器
    recordView();
    
    // 不需要清理延时器
  }, [gameId])
}