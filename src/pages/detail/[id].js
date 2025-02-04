import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Detail() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    if (id) {
      fetchDetail()
    }
  }, [id])

  const fetchDetail = async () => {
    try {
      const response = await fetch(`/api/detail/${id}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('获取详情失败:', error)
    }
    setLoading(false)
  }

  if (loading) return <div>加载中...</div>
  if (!data) return <div>未找到数据</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold">
            搜索系统
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {data.image && (
            <img
              src={data.image}
              alt={data.title}
              className="w-full h-64 object-cover"
              onError={(e) => e.target.style.display = 'none'}
            />
          )}
          
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">{data.title}</h1>
            <p className="text-gray-600 mb-6">{data.description}</p>
            
            <div className="prose max-w-none whitespace-pre-line">
              {data.content}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(data.additionalData).map(([key, value]) => (
                <div 
                  key={key}
                  className="bg-gray-50 p-4 rounded-lg"
                >
                  <h3 className="font-semibold text-gray-700 mb-2">{key}</h3>
                  <p className="text-gray-600 whitespace-pre-line">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 