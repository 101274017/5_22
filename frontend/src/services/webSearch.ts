/**
 * Web 搜索服务
 * 使用 DuckDuckGo Lite（无需 JS，纯 HTML）获取搜索结果
 * 失败时返回空数组，由调用方回退到知识库
 */

export async function webSearch(query: string, maxResults = 3): Promise<string[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    const html = await res.text()

    const snippets: string[] = []
    const resultBlocks = html.split('<a rel="nofollow" class="result__a"')

    for (let i = 1; i < resultBlocks.length && snippets.length < maxResults; i++) {
      const block = resultBlocks[i]
      const snippetMatch = block.match(/class="result__snippet">([^<]+)<\/a>/)
      if (snippetMatch) {
        snippets.push(snippetMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim())
      }
    }

    return snippets
  } catch (err) {
    console.warn('Web 搜索失败:', err)
    return []
  }
}

export async function searchCelebrityInfo(name: string, poiName?: string): Promise<string> {
  const query = poiName ? `${name} ${poiName} 历史 生平` : `${name} 历史 生平 简介`
  const results = await webSearch(query, 3)
  if (results.length === 0) return ''
  return `【网络搜索到的相关历史信息】\n${results.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n请基于以上历史事实进行对话，若与知识库冲突以知识库为准。`
}
