'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, Search, Eye, X } from 'lucide-react'
import { logOperationClient } from '@/lib/logger'
import { safeAsync } from '@/lib/errorHandler'

// 定义游戏类型
interface Game {
  id: string;
  title: string;
  description: string;
  game_url: string;
  cover_url: string;
  category_id: string;
  is_featured: boolean;
  views: number;
  created_at: string;
  categories: {
    id: string;
    name: string;
  }[];
}

// 定义分类类型
interface Category {
  id: string;
  name: string;
}

export default function GamesManagement() {
  const [games, setGames] = useState<Game[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentGame, setCurrentGame] = useState<Game | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    game_url: '',
    cover_url: '',
    category_id: '',
    is_featured: false
  })
  const supabase = createClient()

  useEffect(() => {
    fetchGames()
    fetchCategories()
  }, [])

  const fetchGames = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          categories(id, name)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setGames(data || [])
    } catch (error) {
      console.error('Error fetching games:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredGames = games.filter(game =>
    game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.categories.some(cat => cat.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const openModal = (game: Game | null = null) => {
    if (game) {
      setFormData({
        title: game.title,
        description: game.description || '',
        game_url: game.game_url,
        cover_url: game.cover_url || '',
        category_id: game.category_id || '',
        is_featured: game.is_featured || false
      })
      setCurrentGame(game)
    } else {
      setFormData({
        title: '',
        description: '',
        game_url: '',
        cover_url: '',
        category_id: '',
        is_featured: false
      })
      setCurrentGame(null)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentGame(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    const [userData, userError] = await safeAsync(async () => {
      return await supabase.auth.getUser()
    }, undefined, '获取用户信息');
    
    const user = userData?.data?.user
    
    if (currentGame) {
      // 更新游戏
      const [updateResult, updateError] = await safeAsync(async () => {
        const { error } = await supabase
          .from('games')
          .update(formData)
          .eq('id', currentGame.id)
        
        if (error) throw error
        return { success: true }
      }, (error) => {
        setError(`更新游戏失败: ${error.message}`)
      }, '更新游戏');
      
      if (updateError) return
      
      // 使用新的日志工具记录操作
      const logResult = await logOperationClient({
        userId: user?.id,
        operationType: 'update',
        targetTable: 'games',
        targetId: currentGame.id,
        details: { 
          title: formData.title,
          previous: currentGame,
          updated: formData
        }
      });
      
      if (!logResult.success) {
        console.warn('记录游戏更新操作日志失败:', logResult.error);
      }
      } else {
        // 创建游戏
        const [createResult, createError] = await safeAsync(async () => {
          const { data, error } = await supabase
            .from('games')
            .insert(formData)
            .select()
          
          if (error) throw error
          return data
        }, (error) => {
          setError(`创建游戏失败: ${error.message}`)
        }, '创建游戏');
        
        if (createError) return;
        
        if (createResult && createResult[0]) {
          // 使用新的日志工具记录操作
          const logResult = await logOperationClient({
            userId: user?.id,
            operationType: 'create',
            targetTable: 'games',
            targetId: createResult[0].id,
            details: { title: formData.title, data: formData }
          });
          
          if (!logResult.success) {
            console.warn('记录游戏创建操作日志失败:', logResult.error);
          }
        } else {
          console.warn('创建游戏成功但未返回数据，无法记录日志');
        }
      }
      
      closeModal()
      
      // 刷新游戏列表
      await safeAsync(() => fetchGames(), (error) => {
        console.warn('刷新游戏列表失败:', error);
      });
  }

  const handleDelete = async (game: Game) => {
    if (!confirm(`确定要删除游戏 "${game.title}" 吗？此操作不可撤销。`)) {
      return
    }

    setError(null)
    
    // 获取用户信息
    const [userData, userError] = await safeAsync(async () => {
      return await supabase.auth.getUser()
    }, undefined, '获取用户信息');
    
    const user = userData?.data?.user
    
    // 删除游戏
    const [deleteResult, deleteError] = await safeAsync(async () => {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', game.id)
      
      if (error) throw error
      return { success: true }
    }, (error) => {
      setError(`删除游戏失败: ${error.message}`)
    }, '删除游戏');
    
    if (deleteError) return
    
    // 使用新的日志工具记录操作
    const logResult = await logOperationClient({
      userId: user?.id,
      operationType: 'delete',
      targetTable: 'games',
      targetId: game.id,
      details: { 
        title: game.title,
        deletedGame: game
      }
    });
    
    if (!logResult.success) {
      console.warn('记录游戏删除操作日志失败:', logResult.error);
    }
    
    // 刷新游戏列表
    await safeAsync(() => fetchGames(), (error) => {
      console.warn('刷新游戏列表失败:', error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">游戏管理</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          <span>添加游戏</span>
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-blue-400" />
        </div>
        <input
          type="text"
          placeholder="搜索游戏名称或分类..."
          className="bg-blue-900/20 border border-blue-500/30 text-white rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {/* 游戏列表 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-black/30 rounded-xl border border-blue-500/20 backdrop-blur-sm shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-900/30">
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">游戏名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">分类</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">浏览量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">热门</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">添加日期</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-blue-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-500/10">
                {filteredGames.length > 0 ? (
                  filteredGames.map((game) => (
                    <tr key={game.id} className="hover:bg-blue-900/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{game.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300">{game.categories?.[0]?.name || '未分类'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300">{game.views || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300">
                        {game.is_featured ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            是
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            否
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300">
                        {new Date(game.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => window.open(`/games/${game.id}`, '_blank')}
                            className="text-cyan-400 hover:text-cyan-300 transition-colors"
                            title="查看"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => openModal(game)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="编辑"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(game)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="删除"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-blue-400">
                      {searchTerm ? '没有找到匹配的游戏' : '暂无游戏数据'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 添加/编辑游戏模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-900 to-black border border-blue-500/30 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-blue-500/30">
              <h3 className="text-xl font-bold text-white">
                {currentGame ? '编辑游戏' : '添加新游戏'}
              </h3>
              <button
                onClick={closeModal}
                className="text-blue-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-1">
                  游戏名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="bg-blue-900/20 border border-blue-500/30 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-1">
                  游戏URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  name="game_url"
                  required
                  value={formData.game_url}
                  onChange={handleInputChange}
                  className="bg-blue-900/20 border border-blue-500/30 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/game"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-1">
                  封面图URL
                </label>
                <input
                  type="url"
                  name="cover_url"
                  value={formData.cover_url}
                  onChange={handleInputChange}
                  className="bg-blue-900/20 border border-blue-500/30 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-1">
                  分类
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="bg-blue-900/20 border border-blue-500/30 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- 选择分类 --</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-1">
                  游戏描述 <span className="text-xs text-blue-400">(支持HTML和图片)</span>
                </label>
                <div className="space-y-2">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={6}
                    className="bg-blue-900/20 border border-blue-500/30 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="可以添加HTML标签和图片，例如：<p>游戏描述</p><img src='图片URL' alt='图片描述' />"
                  ></textarea>
                  <div className="text-xs text-blue-400">
                    <p>支持的HTML标签示例：</p>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      <li>&lt;p&gt;段落文本&lt;/p&gt;</li>
                      <li>&lt;h3&gt;小标题&lt;/h3&gt;</li>
                      <li>&lt;img src="图片URL" alt="图片描述" /&gt;</li>
                      <li>&lt;ul&gt;&lt;li&gt;列表项&lt;/li&gt;&lt;/ul&gt;</li>
                      <li>&lt;a href="链接URL"&gt;链接文本&lt;/a&gt;</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_featured"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-blue-300 rounded"
                />
                <label htmlFor="is_featured" className="ml-2 block text-sm text-blue-300">
                  设为热门游戏
                </label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-blue-500/30">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-blue-500/50 text-blue-400 rounded-lg hover:bg-blue-900/30 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}