/**
 * 通用页面顶部栏组件
 */
interface Props {
  title: string
  subtitle?: string
  onBack?: () => void
  backText?: string
  rightSlot?: React.ReactNode
}

export default function PageHeader({ title, subtitle, onBack, backText = '← 返回', rightSlot }: Props) {
  return (
    <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-stone-800/50 px-4 py-3 flex items-center justify-between shrink-0">
      {onBack ? (
        <button onClick={onBack} className="text-xs text-stone-500">
          {backText}
        </button>
      ) : (
        <div className="w-10" />
      )}
      <div className="text-center min-w-0 px-2">
        <div className="text-sm text-stone-200 font-bold truncate">{title}</div>
        {subtitle && <div className="text-[10px] text-stone-500 truncate">{subtitle}</div>}
      </div>
      {rightSlot || <div className="w-10 shrink-0" />}
    </div>
  )
}
