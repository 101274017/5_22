/**
 * 分隔线组件
 */
interface Props {
  text: string
}

export default function Divider({ text }: Props) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 h-px bg-stone-800" />
      <span className="text-[10px] text-stone-600">{text}</span>
      <div className="flex-1 h-px bg-stone-800" />
    </div>
  )
}
