/**
 * 全屏加载遮罩组件
 */
interface Props {
  visible: boolean
  title: string
  subtitle?: string
}

export default function LoadingOverlay({ visible, title, subtitle }: Props) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 border-2 border-stone-700 border-t-amber-400 rounded-full animate-spin mb-4" />
      <p className="text-sm text-stone-300 text-center">{title}</p>
      {subtitle && <p className="text-xs text-stone-500 mt-2 text-center">{subtitle}</p>}
    </div>
  )
}
