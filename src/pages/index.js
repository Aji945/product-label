import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'

export default function Home() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef()

  useEffect(() => {
    if (query.length > 1) {
      fetchSuggestions()
    } else {
      setSuggestions([])
    }
  }, [query])

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/suggestions?q=${query}`)
      const data = await response.json()
      setSuggestions(data)
    } catch (error) {
      console.error('获取建议失败:', error)
    }
    setLoading(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl px-4">
        <h1 className="text-4xl font-bold text-center mb-8">搜索系统</h1>
        
        <form onSubmit={handleSearch} className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="输入关键词搜索..."
          />
          
          <button 
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
          >
            搜索
          </button>

          {suggestions.length > 0 && (
            <div className="absolute w-full mt-1 bg-white rounded-lg shadow-lg border">
              {suggestions.map((item, index) => (
                <div
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setQuery(item.title)
                    router.push(`/search?q=${encodeURIComponent(item.title)}`)
                  }}
                >
                  {item.title}
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
    </div>
  )
} 