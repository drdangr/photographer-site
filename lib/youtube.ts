export function parseYouTubeId(input: string): string | null {
  if (!input) return null
  const s = String(input).trim()
  // Try URL parsing first
  try {
    const u = new URL(s)
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname || ''
    if (host === 'youtu.be') {
      const id = path.split('/').filter(Boolean)[0] || ''
      return sanitizeYouTubeId(id)
    }
    if (host.endsWith('youtube.com')) {
      if (path.startsWith('/watch')) {
        const id = u.searchParams.get('v') || ''
        return sanitizeYouTubeId(id)
      }
      if (path.startsWith('/shorts/')) {
        const id = path.split('/').filter(Boolean)[1] || ''
        return sanitizeYouTubeId(id)
      }
      if (path.startsWith('/embed/')) {
        const id = path.split('/').filter(Boolean)[1] || ''
        return sanitizeYouTubeId(id)
      }
    }
  } catch {
    // Not a full URL; continue with regex fallbacks
  }

  // Fallback patterns
  const byVParam = s.match(/[?&]v=([a-zA-Z0-9_-]{6,})/) // allow 6+ to be tolerant
  if (byVParam) return sanitizeYouTubeId(byVParam[1])

  // youtu.be/<id>
  const short = s.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/)
  if (short) return sanitizeYouTubeId(short[1])

  // /embed/<id> or /shorts/<id>
  const embed = s.match(/youtube\.com\/(?:embed|shorts)\/([a-zA-Z0-9_-]{6,})/)
  if (embed) return sanitizeYouTubeId(embed[1])

  // If it already looks like an ID, accept it
  if (/^[a-zA-Z0-9_-]{6,}$/.test(s)) return sanitizeYouTubeId(s)
  return null
}

export function youtubeThumbUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

export function isYouTubeUrl(input: string): boolean {
  return parseYouTubeId(input) !== null
}

function sanitizeYouTubeId(id: string): string | null {
  if (!id) return null
  // Strip query/fragment
  const clean = id.split('?')[0].split('&')[0].split('#')[0]
  if (/^[a-zA-Z0-9_-]{6,}$/.test(clean)) return clean
  return null
}


