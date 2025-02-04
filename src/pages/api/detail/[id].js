import { google } from 'googleapis'

export default async function handler(req, res) {
  const { id } = req.query

  try {
    const sheets = google.sheets({ 
      version: 'v4', 
      auth: process.env.GOOGLE_API_KEY 
    })
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '15pOyPD6HYcjsfoqkKcuyQeXPMjE3pE9gTTGgIt6MbuA',
      range: 'A:M',
    })

    const [headers, ...rows] = response.data.values || []
    const row = rows[parseInt(id)]

    if (!row) {
      return res.status(404).json({ error: '未找到数据' })
    }

    const detail = {
      title: row[0] || '',
      description: row[1] || '',
      content: row[2] || '',
      image: row[5] || '',
      additionalData: headers.slice(6).reduce((acc, header, i) => {
        acc[header] = row[i + 6] || ''
        return acc
      }, {})
    }

    res.status(200).json(detail)
  } catch (error) {
    console.error('API错误:', error)
    res.status(500).json({ error: '获取详情失败' })
  }
} 