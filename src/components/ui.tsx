import { useEffect, useRef, type ReactNode } from 'react'
import { Atom, BookOpen, Brain, ChartNoAxesCombined, Check, Code2, Globe2, Leaf, LoaderCircle, PenLine, Sparkles, X } from 'lucide-react'
import type { IconName } from '../lib/types'

export function Brand({ small = false }: { small?: boolean }) {
  return <span className={`brand ${small ? 'brand-small' : ''}`}><span className="brand-mark"><BookOpen size={22} strokeWidth={1.8} /><Sparkles className="brand-spark" size={12} fill="currentColor" /></span>{!small && <><span className="brand-word">LearnPath</span><span className="brand-ai">AI</span></>}</span>
}
export function TopicIcon({ name, size = 24 }: { name: IconName; size?: number }) {
  if (name === 'algebra') return <span className="algebra-symbol" style={{ fontSize: size + 7 }}>x<sup>2</sup></span>
  const Icon = { atom: Atom, code: Code2, chart: ChartNoAxesCombined, leaf: Leaf, globe: Globe2, pen: PenLine, brain: Brain }[name]
  return <Icon size={size} strokeWidth={1.65} />
}
export function ProgressRing({ value, size = 88, stroke = 7, children, color = 'var(--green)' }: { value: number; size?: number; stroke?: number; children?: ReactNode; color?: string }) {
  const radius = (size - stroke) / 2
  const circumference = radius * 2 * Math.PI
  return <div className="progress-ring" style={{ width: size, height: size }} role="img" aria-label={`${Math.min(100, Math.max(0, Math.round(value)))} percent`}><svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true"><circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--line)" strokeWidth={stroke} /><circle className="ring-value" cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference} transform={`rotate(-90 ${size / 2} ${size / 2})`} /></svg><div className="ring-content">{children || <strong>{Math.round(value)}%</strong>}</div></div>
}
export function Modal({ children, title, onClose, className = '' }: { children: ReactNode; title: string; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const el = ref.current
    const selector = 'button, a[href], input, select, textarea, [tabindex="0"]'
    const focusable = () => Array.from(el?.querySelectorAll<HTMLElement>(selector) || []).filter(item => !(item as HTMLButtonElement).disabled && item.offsetParent !== null)
    focusable()[0]?.focus()
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key === 'Tab') {
        const items = focusable(); const first = items[0]; const last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', handler)
    return () => { document.body.style.overflow = bodyOverflow; document.removeEventListener('keydown', handler); previous?.focus() }
  }, [])
  return <div className="modal-overlay" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={`modal ${className}`}><button className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}><X size={20} /></button>{children}</div></div>
}
export function Stepper({ current = 0 }: { current?: number }) {
  return <div className="journey-stepper" aria-label="Your learning journey">{['Choose a topic', 'A quick check-in', 'Your personal path'].map((step, i) => <div key={step} className={`journey-step ${i <= current ? 'active' : ''}`}><span>{i < current ? <Check size={13} /> : i + 1}</span><small>{step}</small>{i < 2 && <i />}</div>)}</div>
}
export function Loading({ title = 'Making room for your next discovery…', description = 'Just a moment. Good things are taking shape.' }: { title?: string; description?: string }) {
  return <div className="loading-panel" role="status"><span className="loading-mark"><Sparkles size={30} /><LoaderCircle className="spin loading-orbit" size={68} strokeWidth={0.8} /></span><h2>{title}</h2><p>{description}</p><div className="loading-dots"><i /><i /><i /></div></div>
}
export function PageHeading({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return <div className="page-heading"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{children}</div>
}
export function EmptyState({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h2>{title}</h2><p>{description}</p>{children}</div>
}
export function Options({ options, selected, onSelect, checked = false, correct }: { options: string[]; selected: number | null; onSelect: (n: number) => void; checked?: boolean; correct?: number }) {
  return <div className="question-options" role="group" aria-label="Answer options">{options.map((option, i) => <button key={i} className={`question-option ${selected === i ? 'selected' : ''} ${checked && correct === i ? 'correct' : ''} ${checked && selected === i && correct !== i ? 'incorrect' : ''}`} onClick={() => onSelect(i)} aria-pressed={selected === i} disabled={checked}><span className="option-letter">{String.fromCharCode(65 + i)}</span><span>{option}</span><span className="option-check">{checked && correct === i ? <Check size={16} /> : checked && selected === i && correct !== i ? <X size={16} /> : selected === i ? <span /> : null}</span></button>)}</div>
}
