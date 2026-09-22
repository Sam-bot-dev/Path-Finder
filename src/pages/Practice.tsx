import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, LoaderCircle, RotateCcw, Sparkles, Target, X } from 'lucide-react'
import { useStore, progressOf } from '../lib/store'
import { Loading, Modal, Options, PageHeading, ProgressRing } from '../components/ui'

export function Practice() {
  const { pathId } = useParams<{ pathId: string }>()
  const navigate = useNavigate()
  const { data, completePractice, notify } = useStore()
  const path = data.paths.find(p => p.id === pathId)
  const [active, setActive] = useState(0)
  const [choices, setChoices] = useState<Record<string, number>>({})
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [scores, setScores] = useState<Record<string, number>>({})
  const [finished, setFinished] = useState(false)
  const [timer, setTimer] = useState<ReturnType<typeof setInterval> | null>(null)
  const [seconds, setSeconds] = useState(0)
  const activeRef = useRef(0)
  activeRef.current = active
  useEffect(() => {
    if (finished) { if (timer) clearInterval(timer); return }
    const interval = setInterval(() => setSeconds(s => s + 1), 1000)
    setTimer(interval)
    return () => clearInterval(interval)
  }, [finished])
  if (!path) return <div className="error-page"><h1>Path not found</h1><p>The page you’re looking for has moved or doesn’t exist.</p><Link to="/" className="button primary">Explore topics</Link></div>
  const module = path.modules[active]
  const allComplete = path.modules.every(m => checked[m.id])
  const completedCount = path.modules.filter(m => checked[m.id]).length
  const progress = progressOf(path)
  const select = useCallback((id: string, index: number) => { setChoices(c => ({ ...c, [id]: index })); setChecked(c => ({ ...c, [id]: false })) }, [])
  const submit = (moduleId: string) => {
    const question = module.practice.find(q => q.id === moduleId)
    if (!question || choices[moduleId] === undefined) return
    const correct = question.answer === choices[moduleId]
    setScores(s => ({ ...s, [moduleId]: (s[moduleId] || 0) + (correct ? 1 : 0) }))
    setChecked(c => ({ ...c, [moduleId]: true }))
    completePractice(path.id, module.id, Math.round(Object.values(scores).reduce((sum, score) => sum + score, correct ? 1 : 0) / path.modules.length * 100), seconds)
    if (activeRef.current < path.modules.length - 1) { setActive(a => a + 1); setSeconds(0) }
  }
  const complete = () => {
    const totalScore = Math.round(path.modules.reduce((sum, module) => sum + (module.practice.some(q => q.answer === choices[q.id]) ? 1 : 0), 0) / path.modules.length * 100)
    completePractice(path.id, 'final', totalScore, seconds)
    setFinished(true)
    if (timer) clearInterval(timer)
    notify('Excellent effort! Your practice progress has been saved.')
  }
  if (finished) return <div className="practice-finish"><div className="finish-card"><ProgressRing value={progress} size={120} stroke={7} color="var(--green)"><CheckCircle2 size={48} /></ProgressRing><h2>Practice session complete</h2><p>You explored {path.modules.length} modules and saved your best progress.</p><div className="finish-stats"><div><strong>{path.completed.length}</strong><span>Modules mastered</span></div><div><strong>{Object.values(scores).reduce((sum, s) => sum + s, 0)}</strong><span>Correct answers</span></div></div><div className="finish-actions"><Link to={`/path/${path.id}`} className="button primary"><Sparkles size={16} />Review your path<ArrowRight size={16} /></Link><Link to={`/diagnostic/custom?topic=${encodeURIComponent(path.topicName)}&count=${path.questions.length}`} className="button secondary"><Target size={16} />Retake check-in<ArrowRight size={16} /></Link><button className="text-link" onClick={() => { setFinished(false); setActive(0); setChoices({}); setChecked({}); setScores({}); setSeconds(0) }}><RotateCcw size={14} />Practice again</button></div></div></div>
  return <>
    <PageHeading eyebrow="PRACTICE AND GROW" title={`${path.topicName}`} description="Test your understanding with practice questions for every module. Take your time—each answer teaches you something." />
    <div className="practice-overview"><div className="practice-progress"><ProgressRing value={(completedCount / path.modules.length) * 100} size={60} stroke={4} color="var(--green)" /><span><strong>{completedCount}</strong> / {path.modules.length} done</span></div></div>
    <div className="practice-nav"><button className="icon-button" aria-label="Previous module" onClick={() => setActive(a => Math.max(0, a - 1))} disabled={active === 0}><ArrowLeft size={18} /></button>{path.modules.map((m, i) => <button key={m.id} className={`step-dot ${i === active ? 'active' : ''} ${checked[m.id] ? 'answered' : ''}`} onClick={() => { setActive(i); setSeconds(0) }} aria-label={`Module ${i + 1}`} />)}<button className="icon-button" aria-label="Next module" onClick={() => setActive(a => Math.min(path.modules.length - 1, a + 1))} disabled={active === path.modules.length - 1}><ArrowRight size={18} /></button></div>
    <div className="module-practice"><div className="practice-header"><span className="practice-label">Module {active + 1} of {path.modules.length}</span><h2>{module.title}</h2><p>{module.description}</p></div>{module.practice.map(question => {
      const selected = choices[question.id]
      const isChecked = checked[question.id]
      const isCorrect = question.answer === selected
      return <div key={question.id} className="practice-question"><span className="question-skill">{question.skill}</span><p className="question-prompt">{question.prompt}</p><Options options={question.options} selected={selected} onSelect={index => select(question.id, index)} checked={isChecked} correct={question.answer} />{!isChecked && selected !== undefined && <button className="button secondary small" onClick={() => { setChecked(c => ({ ...c, [question.id]: true })); if (isCorrect) { setScores(s => ({ ...s, [question.id]: (s[question.id] || 0) + 1 })) } }}>Check answer</button>}{isChecked && <div className={`answer-banner ${isCorrect ? 'correct' : 'incorrect'}`}><span className="answer-mark">{isCorrect ? <Check size={18} /> : '×'}</span><div><strong>{isCorrect ? 'That’s right' : 'Not quite'}</strong><p>{question.explanation}</p></div></div>}</div>
    })}<div className="practice-footer">{active < path.modules.length - 1 ? <button className="button primary" onClick={() => { setActive(a => a + 1); setSeconds(0) }}><ArrowRight size={16} />Next module</button> : <button className="button primary" onClick={complete} disabled={!path.modules.every(m => m.practice.some(q => choices[q.id] !== undefined))}><Sparkles size={16} />Finish practice<ArrowRight size={16} /></button>}</div></div>
  </>
}
