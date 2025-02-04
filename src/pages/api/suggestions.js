import { google } from 'googleapis'

export default async function handler(req, res) {
  const { q } = req.query
  
  try {
    const sheets = google.sheets({ 
      version: 'v4', 
      auth: process.env.GOOGLE_API_KEY 
    })
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: 'A:E',
    })

    const rows = response.data.values || []
    
    // 过滤匹配的建议
    const suggestions = rows
      .filter(row => row[0]?.toLowerCase().includes(q.toLowerCase()))
      .slice(0, 5)
      .map(row => ({
        title: row[0],
        description: row[1],
        content: row[2],
        image: row[5]
      }))

    res.status(200).json(suggestions)
  } catch (error) {
    console.error('API错误:', error)
    res.status(500).json({ error: '获取建议失败' })
  }
} 