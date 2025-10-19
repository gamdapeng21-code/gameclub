'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit, Trash2, X } from 'lucide-react'
import { logOperationClient } from '@/lib/logger'

// 定义分类类型
interface Category {
  id: string;
  name: string;
  slug: string;
  games?: any[];
  gamesCount: number;
  created_at: string;
}

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  })
  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('categories')
        .select('*, games(id)')
        .order('name')
      
      if (error) throw error
      
      // 计算每个分类下的游戏数量
      const categoriesWithCount = data.map(category => ({
        ...category,
        gamesCount: category.games ? category.games.length : 0
      }))
      
      setCategories(categoriesWithCount || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (category: Category | null = null) => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug
      })
      setCurrentCategory(category)
    } else {
      setFormData({
        name: '',
        slug: ''
      })
      setCurrentCategory(null)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentCategory(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // 自动生成slug
    if (name === 'name' && !currentCategory) {
      // 确保slug不是纯数字，添加前缀
      const rawSlug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const isNumeric = /^\d+$/.test(rawSlug)
      
      // 如果是纯数字，添加'category-'前缀
      const finalSlug = isNumeric ? `category-${rawSlug}` : rawSlug
      
      setFormData(prev => ({
        ...prev,
        slug: finalSlug
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (currentCategory) {
        // 更新分类
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', currentCategory.id)
        
        if (error) throw error
        
        // 使用新的日志工具记录操作
        try {
          console.log('准备记录更新操作日志');
          const logResult = await logOperationClient({
            userId: user?.id || '00000000-0000-0000-0000-000000000000',
            operationType: 'update',
            targetTable: 'categories',
            targetId: currentCategory.id,
            details: { 
              name: formData.name,
              previous: currentCategory,
              updated: formData
            }
          });
          console.log('更新操作日志记录结果:', logResult);
        } catch (logError) {
          console.error('记录更新操作日志失败:', logError);
        }
      } else {
        // 创建分类
        const { data, error } = await supabase
          .from('categories')
          .insert(formData)
          .select()
        
        if (error) throw error
        
        // 使用新的日志工具记录操作
        try {
          console.log('准备记录创建操作日志');
          if (data && data[0]) {
            const logResult = await logOperationClient({
              userId: user?.id || '00000000-0000-0000-0000-000000000000',
              operationType: 'create',
              targetTable: 'categories',
              targetId: data[0].id,
              details: { 
                name: formData.name,
                data: formData
              }
            });
            console.log('创建操作日志记录结果:', logResult);
          } else {
            console.error('创建分类成功但未返回数据，无法记录日志');
          }
        } catch (logError) {
          console.error('记录创建操作日志失败:', logError);
        }
      }
      
      closeModal()
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('保存分类时出错，请重试')
    }
  }

  const handleDelete = async (category: Category) => {
    if (category.gamesCount > 0) {
      alert(`无法删除分类 "${category.name}"，因为该分类下有 ${category.gamesCount} 个游戏。请先移除或重新分类这些游戏。`)
      return
    }
    
    if (!confirm(`确定要删除分类 "${category.name}" 吗？此操作不可撤销。`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)
      
      if (error) throw error

      // 使用新的日志工具记录操作
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await logOperationClient({
          userId: user.id,
          operationType: 'delete',
          targetTable: 'categories',
          targetId: category.id,
          details: { 
            name: category.name,
            deletedCategory: category
          }
        })
      }

      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('删除分类时出错，请重试')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">分类管理</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          <span>添加分类</span>
        </button>
      </div>

      {/* 分类列表 */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">分类名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">游戏数量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">创建日期</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-blue-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-500/10">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <tr key={category.id} className="hover:bg-blue-900/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{category.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300">{category.slug}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300">{category.gamesCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300">
                        {new Date(category.created_at).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openModal(category)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="编辑"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="删除"
                            disabled={category.gamesCount > 0}
                          >
                            <Trash2 size={18} className={category.gamesCount > 0 ? 'opacity-50 cursor-not-allowed' : ''} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-blue-400">暂无分类数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 添加/编辑分类模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-blue-900 to-black border border-blue-500/30 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-blue-500/30">
              <h3 className="text-xl font-bold text-white">
                {currentCategory ? '编辑分类' : '添加新分类'}
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
                  分类名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-blue-900/20 border border-blue-500/30 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-blue-300 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="slug"
                  required
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="bg-blue-900/20 border border-blue-500/30 text-white rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：action-games"
                />
                <p className="mt-1 text-xs text-blue-400">
                  用于URL的唯一标识符，只能包含小写字母、数字和连字符
                </p>
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