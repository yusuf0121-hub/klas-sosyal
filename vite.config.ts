import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function tenorApi(): Plugin {
  return {
    name: 'tenor-api',
    configureServer(server) {
      server.middlewares.use('/api/tenor', async (req, res) => {
        const url = new URL(req.url ?? '', 'http://localhost')
        const query = url.searchParams.get('q')?.trim()
        const apiKey = process.env.GIPHY_API_KEY
        if (!query) { res.statusCode = 400; res.end(JSON.stringify({ error: 'Missing query' })); return }
        if (!apiKey) { res.statusCode = 503; res.end(JSON.stringify({ error: 'GIPHY_API_KEY is not configured' })); return }
        const params = new URLSearchParams({ api_key: apiKey, q: query, limit: '12', rating: 'pg-13', lang: 'tr' })
        const response = await fetch(`https://api.giphy.com/v1/gifs/search?${params}`)
        const data = await response.json() as { data?: Array<{ id: string; title?: string; images?: { original?: { url?: string }; fixed_width?: { url?: string } } }> }
        res.statusCode = response.ok ? 200 : 502
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify({ results: (data.data ?? []).map((item) => ({ id: item.id, title: item.title ?? 'GIF', url: item.images?.original?.url ?? item.images?.fixed_width?.url })).filter((item) => item.url) }))
      })
    },
  }
}

function assistantApi(): Plugin {
  return {
    name: 'assistant-api',
    configureServer(server) {
      server.middlewares.use('/api/assistant', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        let body = ''
        for await (const chunk of req) body += chunk
        const { message } = JSON.parse(body || '{}') as { message?: string }
        const apiKey = process.env.GROQ_API_KEY
        if (!apiKey) {
          res.statusCode = 503
          res.end(JSON.stringify({ error: 'GROQ_API_KEY is not configured' }))
          return
        }
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ model: 'openai/gpt-oss-20b', messages: [{ role: 'system', content: 'Sen Klas Sosyal uygulamasının kişisel asistanısın. Türkçe, kısa, yararlı ve güvenli cevaplar ver.' }, { role: 'user', content: message?.trim() ?? '' }], temperature: 0.7, max_tokens: 500 }),
        })
        res.statusCode = response.ok ? 200 : 502
        res.setHeader('content-type', 'application/json')
        const payload = await response.text()
        res.end(JSON.stringify(response.ok ? { text: (JSON.parse(payload) as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content ?? '' } : { error: `Groq request failed (${response.status})`, details: payload.slice(0, 240) }))
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return { server: { allowedHosts: true }, plugins: [react(), tenorApi(), assistantApi(), VitePWA({ registerType: 'autoUpdate', includeAssets: ['favicon.svg'], manifest: { name: 'Klas Sosyal', short_name: 'Klas Sosyal', description: 'Klas Sosyal topluluk uygulaması', theme_color: '#0f172a', background_color: '#f8fafc', display: 'standalone', start_url: '/' } })], resolve: { alias: { '@': '/src' } } }
})
