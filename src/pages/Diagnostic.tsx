import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Clock3, LoaderCircle, Sparkles } from 'lucide-react'
import { getTopic } from '../data/topics'
import { learningService } from '../lib/services'
import { useStore } from '../lib/store'
import { Loading, Options, PageHeading, Stepper } from '../components/ui'

export function Diagnostic() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const { data, savePath, notify } = useStore()
  const [topic, setTopic] = useState(topicId ? getTopic(topicId) : undefined)
  const [step, setStep] = useState(0)
  const [choices, setChoices] = useState<number[]>([...Array(5)].map(() => -1))
  const [checked, setChecked] = useState(false)
  const [questions, setQuestions] = useState(getTopic(topicId || '')?.questions || [])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'curated' | 'ai'>('curated')
  const start = useRef(Date.now())
  const startedRef = useRef(false)
  const started = () => { if (!startedRef.current) { startedRef.current = true; start.current = Date.now() } }
  useEffect(() => { if (!topicId || !topic || !questions.length) { setLoading(false); return } if (startedRef.current) return; const generate = async () => { try { startedRef.current = true; const generated = await learningService.diagnostic(topic); setQuestions(generated.questions); setSource(generated.source); setLoading(false) } catch { setLoading(false) } }; generate() }, [topic, topicId])
  const question = questions[step]
  const choice = choices[step]
  const isCorrect = question ? question.answer === choice : false
  const hasAnswered = choices.every(c => c !== -1)
  const next = () => { setStep(s => Math.min(questions.length - 1, s + 1)); setChecked(false) }
  const prev = () => { setStep(s => Math.max(0, s - 1)); setChecked(false) }
  const select = useCallback((index: number) => { started(); setChoices(choices => choices.map((c, i) => i === step ? index : c)); setChecked(false) }, [step])
  const submit = async () => {
    if (!topic || !hasAnswered || !questions.length) return
    const seconds = Math.round((Date.now() - start.current) / 1000)
    setLoading(true)
    try {
      const generated = await learningService.path(topic, questions, choices, source)
      savePath({ ...generated, questions, answers: choices, source }, seconds)
      navigate(`/results/${generated.id}`)
    } catch { notify('Something went wrong. Please try again.'); setLoading(false) }
  }
  if (loading) return <Loading />
  if (!topic || !questions.length) return <div className="error-page"><h1>We couldn’t find this topic</h1><p>The page you’re looking for has moved or doesn’t exist.</p><Link to="/" className="button primary">Explore topics</Link></div>
  return <>
    <Stepper current={hasAnswered ? 1 : 0} />
    <PageHeading eyebrow="YOUR CHECK-IN" title={topic.name} description="Five warm questions. Take your time. This is just for you." />
    <div className="quiz"><div className="question-stepper"><span className="question-number">Question {step + 1} <span> / 5</span></span><span className="question-timer"><Clock3 size={13} />{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div><div className="question-card"><span className="question-skill">{question.skill}</span><p className="question-prompt">{question.prompt}</p><Options options={question.options} selected={choice} onSelect={select} checked={checked} correct={question.answer} /><div className="question-footer"><div className="question-nav"><button className="icon-button" aria-label="Previous question" onClick={prev} disabled={step === 0}><ArrowLeft size={18} /></button>{[0,1,2,3,4].map(i => <button key={i} className={`step-dot ${i === step ? 'active' : ''} ${choices[i] !== -1 ? 'answered' : ''}`} onClick={() => { setStep(i); setChecked(false) }} aria-label={`Question ${i + 1}`} aria-current={i === step} />)}<button className="icon-button" aria-label="Next question" onClick={next} disabled={step === questions.length - 1}><ArrowRight size={18} /></button></div><span className="question-skill">{question.skill}</span></div></div>{checked && <div className={`answer-banner ${isCorrect ? 'correct' : 'incorrect'}`}><span className="answer-mark">{isCorrect ? <Check size={18} /> : '×'}</span><div><strong>{isCorrect ? 'That’s right' : 'Not quite'}</strong><p>{question.explanation}</p></div></div>}{!checked && choice !== -1 && step < questions.length - 1 && <button className="button secondary small" onClick={() => { setChecked(true); if (isCorrect) setTimeout(() => { next(); setChecked(false) }, 1200) }}><Check size={15} />Check answer</button>}{!checked && choice !== -1 && step === questions.length - 1 && <button className="button primary" onClick={() => setChecked(true)}><Check size={16} />Check answer<ArrowRight size={16} /></button>}{checked && <button className="button primary" onClick={step < questions.length - 1 ? next : submit} disabled={hasAnswered && !questions.every((q, i) => q.answer === choices[i]) && step === questions.length - 1}><Sparkles size={17} />{step < questions.length - 1 ? 'Continue' : 'Build my path'}<ArrowRight size={17} /></button>}</div>
  </>
}
