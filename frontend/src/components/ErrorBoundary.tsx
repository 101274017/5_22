import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  errorMessage?: string
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-stone-950 via-stone-900 to-black px-6">
          <div className="text-4xl mb-4">🌌</div>
          <h1 className="text-lg font-bold text-stone-100 tracking-wider mb-2">时空裂缝出现剧烈波动</h1>
          <p className="text-sm text-stone-400 text-center mb-6">
            跨越千年的通道暂时不稳定...<br />
            请尝试重新进入应用
          </p>
          <button
            onClick={() => {
              this.props.onReset?.()
              window.location.reload()
            }}
            className="bg-amber-800 text-amber-100 px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform"
          >
            返回时空入口
          </button>
          {this.state.errorMessage && (
            <p className="text-[10px] text-stone-600 mt-4 font-mono max-w-xs break-all">
              {this.state.errorMessage}
            </p>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
