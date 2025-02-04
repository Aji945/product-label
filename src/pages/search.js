import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Search() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { q } = router.query

  useEffect(() => {
    if (q) {
      fetchResults()
    }
  }, [q])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('搜索失败:', error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold">
            搜索系统
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div>加载中...</div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              找到 {results.length} 个结果
            </p>
            
            <div className="space-y-8">
              {results.map((result, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow hover:shadow-md">
                  <Link 
                    href={`/detail/${encodeURIComponent(result.id)}`}
                    className="group"
                  >
                    <h2 className="text-xl font-semibold text-blue-600 group-hover:underline">
                      {result.title}
                    </h2>
                    
                    {result.image && (
                      <img
                        src={result.image}
                        alt={result.title}
                        className="w-24 h-24 object-cover rounded mt-2"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    
                    <p className="mt-2 text-sm text-gray-600">
                      {result.description}
                    </p>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      {result.content}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
} 