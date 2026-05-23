/**
 * 导游设定页：设定名人、时期、古迹，创建讲解团
 * P0-2: 名人-古迹关联校验
 * P0-4: 时期选择强制化
 */
import { useState } from 'react'
import { PageRoute } from '@/App'
import { guideApi } from '@/api/client'
import PageHeader from '@/components/PageHeader'
import { getPeriodsForCelebrity, PeriodOption } from '@/data/periods'
import { checkStrongLink } from '@/data/strongLinks'

interface Props {
  userId: string
  guideName: string
  onNavigate: (route: PageRoute) => void
}

const CELEBRITY_SUGGESTIONS = [
  { name: '苏东坡', era: '北宋' },
  { name: '李白', era: '唐' },
  { name: '杜甫', era: '唐' },
  { name: '王维', era: '唐' },
  { name: '辛弃疾', era: '南宋' },
  { name: '许仙', era: '南宋' },
]

const POI_SUGGESTIONS = [
  '惠州西湖', '断桥', '罗浮山', '西湖苏堤', '黄鹤楼', '岳阳楼',
  '滕王阁', '故宫', '长城', '兵马俑', '莫高窟', '布达拉宫',
]

export default function GuideSetupPage({ userId, guideName, onNavigate }: Props) {
  const [celebrityName, setCelebrityName] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption | null>(null)
  const [customAge, setCustomAge] = useState('')
  const [poiName, setPoiName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [linkWarning, setLinkWarning] = useState<string | null>(null)
  const [linkConfirmed, setLinkConfirmed] = useState(false)

  const periods = getPeriodsForCelebrity(celebrityName)
  const hasPeriods = periods && periods.length > 0

  // 判断时期是否已选（有预设时期的必须选，没有的可以自定义）
  const periodSelected = hasPeriods ? !!selectedPeriod : true
  const celebrityAge = selectedPeriod?.label || customAge

  const canCreate = celebrityName.trim() && poiName.trim() && periodSelected && (linkWarning === null || linkConfirmed)

  const handleCelebrityChange = (name: string) => {
    setCelebrityName(name)
    setSelectedPeriod(null)
    setCustomAge('')
    setLinkWarning(null)
    setLinkConfirmed(false)
    // 如果已选古迹，检查关联
    if (poiName.trim()) {
      const result = checkStrongLink(name, poiName.trim())
      if (!result.isStrong) {
        setLinkWarning(result.message)
        setLinkConfirmed(false)
      }
    }
  }

  const handlePoiChange = (poi: string) => {
    setPoiName(poi)
    setLinkWarning(null)
    setLinkConfirmed(false)
    // 检查关联
    if (celebrityName.trim()) {
      const result = checkStrongLink(celebrityName.trim(), poi)
      if (!result.isStrong) {
        setLinkWarning(result.message)
        setLinkConfirmed(false)
      }
    }
  }

  const handleCreate = async () => {
    if (!canCreate || creating) return
    setCreating(true)

    try {
      const data = await guideApi.createTour({
        guide_id: userId,
        guide_name: guideName,
        celebrity_name: celebrityName.trim(),
        celebrity_age: celebrityAge || undefined,
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
            onChange={(e) => handleCelebrityChange(e.target.value)}
            placeholder="输入名人名字（如：苏东坡、李白）"
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {CELEBRITY_SUGGESTIONS.map((c) => (
              <button
                key={c.name}
                onClick={() => handleCelebrityChange(c.name)}
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

        {/* P0-4: 时期选择（强制） */}
        <div className="space-y-2">
          <label className="text-xs text-stone-400 font-bold tracking-wider">
            时期/年龄 {hasPeriods ? '*' : '（可选）'}
          </label>
          {hasPeriods ? (
            <div className="space-y-2">
              {periods.map((period) => (
                <button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period)}
                  className={`w-full text-left p-3 rounded-xl border transition ${
                    selectedPeriod?.id === period.id
                      ? 'bg-amber-900/40 border-amber-700/50'
                      : 'bg-stone-900/60 border-stone-800 active:bg-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${
                      selectedPeriod?.id === period.id ? 'text-amber-200' : 'text-stone-300'
                    }`}>
                      {period.label}
                    </span>
                    {selectedPeriod?.id === period.id && (
                      <span className="text-amber-400 text-xs">✓</span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-500 mt-0.5">{period.description}</p>
                </button>
              ))}
              {!selectedPeriod && (
                <p className="text-[10px] text-red-400/80 ml-1">⚠️ 请选择一个时期才能创建讲解团</p>
              )}
            </div>
          ) : (
            <input
              type="text"
              value={customAge}
              onChange={(e) => setCustomAge(e.target.value)}
              placeholder="如：中年（44岁）、被贬惠州时期"
              className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700"
            />
          )}
        </div>

        {/* 名胜古迹 */}
        <div className="space-y-2">
          <label className="text-xs text-stone-400 font-bold tracking-wider">名胜古迹 *</label>
          <input
            type="text"
            value={poiName}
            onChange={(e) => handlePoiChange(e.target.value)}
            placeholder="输入名胜古迹名称"
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {POI_SUGGESTIONS.map((poi) => (
              <button
                key={poi}
                onClick={() => handlePoiChange(poi)}
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

        {/* P0-2: 关联度警告 */}
        {linkWarning && (
          <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-3 space-y-2">
            <p className="text-xs text-red-300">⚠️ {linkWarning}</p>
            <button
              onClick={() => setLinkConfirmed(true)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                linkConfirmed
                  ? 'bg-amber-900/50 border-amber-700/50 text-amber-200'
                  : 'bg-stone-900/60 border-stone-700 text-stone-400'
              }`}
            >
              {linkConfirmed ? '✓ 已确认继续' : '确认继续使用'}
            </button>
          </div>
        )}

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
          disabled={!canCreate || creating}
          className="w-full bg-amber-800 text-amber-100 py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-40"
        >
          {creating ? '正在创建...' : '创建讲解团并生成二维码'}
        </button>
      </div>
    </div>
  )
}
