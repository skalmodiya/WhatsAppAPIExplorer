import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CodeBlock({ code, lang = 'json', maxHeight = '300px' }) {
  const [copied, setCopied] = useState(false)

  let display = code
  if (lang === 'json' && typeof code === 'object') {
    try { display = JSON.stringify(code, null, 2) } catch { display = String(code) }
  } else if (typeof code === 'object') {
    try { display = JSON.stringify(code, null, 2) } catch { display = String(code) }
  }

  const copy = () => {
    navigator.clipboard.writeText(display).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="relative rounded-lg bg-gray-900 text-gray-100 text-xs font-mono">
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
        title="Copy"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre className="p-4 overflow-auto" style={{ maxHeight }}>
        {display}
      </pre>
    </div>
  )
}
