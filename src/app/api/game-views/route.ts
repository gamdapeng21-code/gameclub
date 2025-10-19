import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { gameId } = await request.json()
    
    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 })
    }
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // 调用数据库函数增加游戏浏览量
    const { data, error } = await supabase
      .rpc('increment_game_view', { game_id: gameId })
      
    if (error) {
      console.error('Error incrementing game view:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in game-views API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')
    const days = searchParams.get('days') || '7'
    
    const supabase = createRouteHandlerClient({ cookies })
    
    if (gameId) {
      // 获取特定游戏的浏览数据
      const { data, error } = await supabase
        .from('game_views')
        .select('*')
        .eq('game_id', gameId)
        .order('view_date', { ascending: false })
      
      if (error) {
        console.error('Error fetching game views:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ data })
    } else {
      // 获取所有游戏的浏览趋势数据
      const { data, error } = await supabase
        .rpc('get_game_views_trend', { days_count: parseInt(days) })
      
      if (error) {
        console.error('Error fetching game views trend:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      
      return NextResponse.json({ data })
    }
  } catch (error) {
    console.error('Error in game-views API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}