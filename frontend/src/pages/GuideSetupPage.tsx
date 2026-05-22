/**
 * 导游设定页：设定名人、年龄、古迹，创建讲解团
 */
import { useState } from 'react'
import { PageRoute } from '@/App'
import { guideApi } from '@/api/client'
import PageHeader from '@/components/PageHeader'

interface Props {
  userId: string
  guideName: string
  onNavigate: (route: PageRoute) => void
}

const CELEBRITY_SUGGESTIONS = [
  { name: '苏东坡', era: '北宋', ages: ['青年（20-30岁）', '中年（40-50岁）', '晚年（60岁）'] },
  { name: '李白', era: '唐', ages: ['青年（25岁）', '中年（42岁）', '晚年（60岁）'] },
  { name: '杜甫', era: '唐', ages: ['青年（20岁）', '中年（44岁）', '晚年（58岁）'] },
  { name: '王维', era: '唐', ages: ['青年（21岁）', '中年（40岁）', '晚年（60岁）'] },
  { name: '辛弃疾', era: '南宋', ages: ['青年（21岁）', '中年（40岁）', '晚年（67岁）'] },
  { name: '许仙', era: '南宋', ages: ['青年（20岁）'] },
]

const POI_SUGGESTIONS = [
  '惠州西湖', '断桥', '罗浮山', '西湖苏堤', '黄鹤楼', '岳阳楼',
  '滕王阁', '故宫', '长城', '兵马俑', '莫高窟', '布达拉宫',
]

export default function GuideSetupPage({ userId, guideName, onNavigate }: Props) {
  const [celebrityName, setCelebrityName] = useState('')
  const [celebrityAge, setCelebrityAge] = useState('')
  const [poiName, setPoiName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!celebrityName.trim() || !poiName.trim() || creating) return
    setCreating(true)

    try {
      const data = await guideApi.createTour({
        guide_id: userId,
        guide_name: guideName,
        celebrity_name: celebrityName.trim(),
        celebrity_age: celebrityAge.trim() || undefined,
        poi_name: poiName.trim(),
        description: description.trim() || undefined,
      })

      onNavigate({
        page: 'guide-qrcode',
        tourId: data.tour_id,
        tourCode: data.tour_code,
        celebrityName: celebrityName.trim(),
        poiName: poiName.trim(),
        guideName,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`创建失败：${msg}`)
    } finally {
      setCreating(false)
    }
  }

  const selectCelebrity = (name: string) => {
    setCelebrityName(name)
    setCelebrityAge('')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-stone-950 via-stone-900 to-black">
      <PageHeader title="创建讲解团" onBack={() => onNavigate({ page: 'guide-entry' })} />

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* 名人选择 */}
        <div className="space-y-2">
          <label className="text-xs text-stone-400 font-bold tracking-wider">名人是谁 *</label>
          <input
            type="text"
            value={celebrityName}
            onChange={(e) => setCelebrityName(e.target.value)}
            placeholder="输入名人名字（如：苏东坡、李白）"
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700"
          />
          {/* 快速选择 */}
          <div className="flex flex-wrap gap-2 mt-2">
            {CELEBRITY_SUGGESTIONS.map((c) => (
              <button
                key={c.name}
                onClick={() => selectCelebrity(c.name)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  celebrityName === c.name
                    ? 'bg-amber-900/50 border-amber-700/50 text-amber-200'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 active:bg-stone-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* 名人年龄/时期 */}
        <div className="space-y-2">
          <label className="text-xs text-stone-400 font-bold tracking-wider">什么时候的名人（年龄/时期）</label>
          <input
            type="text"
            value={celebrityAge}
            onChange={(e) => setCelebrityAge(e.target.value)}
            placeholder="如：中年（44岁）、被贬惠州时期"
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700"
          />
          {/* 如果选了预设名人，显示年龄建议 */}
          {celebrityName && (() => {
            const suggestion = CELEBRITY_SUGGESTIONS.find(c => c.name === celebrityName)
            if (!suggestion) return null
            return (
              <div className="flex flex-wrap gap-2 mt-2">
                {suggestion.ages.map((age) => (
                  <button
                    key={age}
                    onClick={() => setCelebrityAge(age)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                      celebrityAge === age
                        ? 'bg-amber-900/50 border-amber-700/50 text-amber-200'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 active:bg-stone-800'
                    }`}
                  >
                    {age}
                  </button>
                ))}
              </div>
            )
          })()}
        </div>

        {/* 名胜古迹 */}
        <div className="space-y-2">
          <label className="text-xs text-stone-400 font-bold tracking-wider">名胜古迹 *</label>
          <input
            type="text"
            value={poiName}
            onChange={(e) => setPoiName(e.target.value)}
            placeholder="输入名胜古迹名称"
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {POI_SUGGESTIONS.map((poi) => (
              <button
                key={poi}
                onClick={() => setPoiName(poi)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  poiName === poi
                    ? 'bg-amber-900/50 border-amber-700/50 text-amber-200'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 active:bg-stone-800'
                }`}
              >
                {poi}
              </button>
            ))}
          </div>
        </div>

        {/* 讲解团描述 */}
        <div className="space-y-2">
          <label className="text-xs text-stone-400 font-bold tracking-wider">讲解团描述（可选）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="简要描述本次讲解的主题或特色..."
            rows={3}
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700 resize-none"
          />
        </div>

        {/* 预览 */}
        {celebrityName && poiName && (
          <div className="bg-stone-900/60 border border-amber-900/30 rounded-2xl p-4 space-y-2">
            <div className="text-[10px] text-amber-500 font-bold tracking-widest">讲解预览</div>
            <p className="text-sm text-stone-300">
              <span className="text-amber-200 font-bold">{celebrityName}</span>
              {celebrityAge && <span className="text-stone-400">（{celebrityAge}）</span>}
              {' '}将以第一人称视角为游客讲解{' '}
              <span className="text-amber-200 font-bold">{poiName}</span>
            </p>
          </div>
        )}

        {/* 创建按钮 */}
        <button
          onClick={handleCreate}
          disabled={!celebrityName.trim() || !poiName.trim() || creating}
          className="w-full bg-amber-800 text-amber-100 py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-40"
        >
          {creating ? '正在创建...' : '创建讲解团并生成二维码'}
        </button>
      </div>
    </div>
  )
}
