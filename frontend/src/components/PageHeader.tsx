/**
 * 通用页面顶部栏组件
 * - 支持安卓状态栏安全区（safe-area-inset-top）避免被状态栏遮挡
 * - 返回按钮加大点击区域（>=44x44），手指好按
 */
interface Props {
  title: string
  subtitle?: string
  onBack?: () => void
  backText?: string
  rightSlot?: React.ReactNode
}

export default function PageHeader({ title, subtitle, onBack, backText = '返回', rightSlot }: Props) {
  return (
    <div
      className="sticky top-0 z-10 bg-black/85 backdrop-blur-md border-b border-stone-800/50 shrink-0"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 8px)' }}
    >
      <div className="px-3 pb-3 flex items-center justify-between min-h-[48px]">
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="返回"
            className="flex items-center gap-1 text-stone-200 active:text-amber-300 px-3 py-2 -ml-1 rounded-lg active:bg-stone-800/60"
          >
            <span className="text-lg leading-none">←</span>
            <span className="text-xs">{backText}</span>
          </button>
        ) : (
          <div className="w-14" />
        )}
        <div className="text-center min-w-0 px-2 flex-1">
          <div className="text-sm text-stone-100 font-bold truncate">{title}</div>
          {subtitle && <div className="text-[10px] text-stone-500 truncate mt-0.5">{subtitle}</div>}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : <div className="w-14 shrink-0" />}
      </div>
    </div>
  )
}
