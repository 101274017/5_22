/**
 * 导游设定页：设定名人、时期、古迹，创建讲解团
 * P0-2: 名人-古迹关联校验
 * P0-4: 时期选择强制化
 */
import { useMemo, useState } from 'react'
import { PageRoute } from '@/types/routes'
import { createLocalTour } from '@/services/guideEngine'
import PageHeader from '@/components/PageHeader'
import { getPeriodsForCelebrity, PeriodOption } from '@/data/periods'
import { checkStrongLink, STRONG_LINKS } from '@/data/strongLinks'

interface Props {
  tenantId: string
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

const POI_FALLBACK = [
  '惠州西湖', '断桥', '罗浮山', '西湖苏堤', '黄鹤楼', '岳阳楼',
  '滕王阁', '寒山寺', '杜甫草堂', '故宫', '长城', '兵马俑',
]

export default function GuideSetupPage({ tenantId: _tenantId, userId, guideName, onNavigate }: Props) {
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

  const poiSuggestions = useMemo(() => {
    const trimmed = celebrityName.trim()
    if (!trimmed) return POI_FALLBACK
    const linked = STRONG_LINKS[trimmed]
    if (linked && linked.length > 0) return linked
    return POI_FALLBACK
  }, [celebrityName])
  const poiSuggestionsAreCurated = !!STRONG_LINKS[celebrityName.trim()]

  const periodSelected = hasPeriods ? !!selectedPeriod : true
  const celebrityAge = selectedPeriod?.label || customAge

  const canCreate = celebrityName.trim() && poiName.trim() && periodSelected && (linkWarning === null || linkConfirmed)

  const handleCelebrityChange = (name: string) => {
    setCelebrityName(name)
    setSelectedPeriod(null)
    setCustomAge('')
    setLinkWarning(null)
    setLinkConfirmed(false)
    const trimmed = name.trim()
    const linked = trimmed ? STRONG_LINKS[trimmed] : undefined
    if (poiName.trim() && linked && linked.length > 0) {
      const stillMatches = linked.some(
        (p) => p.includes(poiName.trim()) || poiName.trim().includes(p)
      )
      if (!stillMatches) {
        setPoiName('')
      } else {
        const result = checkStrongLink(name, poiName.trim())
        if (!result.isStrong) {
          setLinkWarning(result.message)
          setLinkConfirmed(false)
        }
      }
    } else if (poiName.trim()) {
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
      const tour = createLocalTour({
        guideId: userId,
        guideName,
        celebrityName: celebrityName.trim(),
        celebrityAge: celebrityAge || undefined,
        poiName: poiName.trim(),
        description: description.trim() || undefined,
      })

      onNavigate({
        page: 'guide-qrcode',
        tourId: tour.id,
        tourCode: tour.tourCode,
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

        <div className="space-y-2">
          <label className="text-xs text-stone-400 font-bold tracking-wider">名胜古迹 *</label>
          <input
            type="text"
            value={poiName}
            onChange={(e) => handlePoiChange(e.target.value)}
            placeholder={
              celebrityName.trim()
                ? `输入或从下方推荐中选择${celebrityName.trim()}相关的古迹`
                : '输入名胜古迹名称'
            }
            className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-700"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-stone-500 tracking-wider">
              {poiSuggestionsAreCurated
                ? `🎯 与「${celebrityName.trim()}」强关联的古迹`
                : celebrityName.trim()
                  ? '通用古迹推荐（未找到匹配数据）'
                  : '请先选择名人，将自动推荐相关古迹'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {poiSuggestions.map((poi) => (
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

        <button
          onClick={handleCreate}
          disabled={!canCreate || creating}
          className="w-full bg-amber-800 text-amber-100 py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-40"
        >
          {creating ? '正在创建...' : '创建讲解团'}
        </button>
      </div>
    </div>
  )
}
