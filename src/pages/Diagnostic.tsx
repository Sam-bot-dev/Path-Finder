import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Clock3, LoaderCircle, Sparkles } from 'lucide-react'
import { getTopic } from '../data/topics'
import { learningService } from '../lib/services'
import { useStore } from '../lib/store'
import { Loading, Options, PageHeading, Stepper } from '../components/ui'
import type { Question } from '../lib/types'

export function Diagnostic() {
  const { topicId } = useParams<{ topicId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { savePath, notify } = useStore()

  // Determine topic name and configuration
  const queryTopic = searchParams.get('topic')
  const countParam = Number(searchParams.get('count')) || 5
  const questionCount = Math.max(5, Math.min(10, countParam))
  const levelParam = searchParams.get('level') || 'All levels'

  const curatedTopic = topicId && topicId !== 'custom' ? getTopic(topicId) : undefined
  const topicName = queryTopic || curatedTopic?.name || (topicId ? decodeURIComponent(topicId) : 'General Study')

  const [step, setStep] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [choices, setChoices] = useState<number[]>([])
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('Preparing your diagnostic check-in…')
  const [source, setSource] = useState<'curated' | 'ai'>('ai')

  const start = useRef(Date.now())
  const startedRef = useRef(false)
  const started = () => {
    if (!startedRef.current) {
      startedRef.current = true
      start.current = Date.now()
    }
  }

  // Load or generate questions
  useEffect(() => {
    let cancelled = false

    const loadQuestions = async () => {
      setLoading(true)
      setLoadingMessage(`Crafting ${questionCount} diagnostic questions on "${topicName}" with Gemini AI…`)

      try {
        const result = await learningService.diagnostic(topicName, questionCount, levelParam)
        if (cancelled) return

        if (result.questions && result.questions.length > 0) {
          setQuestions(result.questions)
          setChoices(new Array(result.questions.length).fill(-1))
          setSource(result.source)
        } else if (curatedTopic?.questions) {
          setQuestions(curatedTopic.questions)
          setChoices(new Array(curatedTopic.questions.length).fill(-1))
          setSource('curated')
        }
      } catch (err) {
        console.error('Failed to generate diagnostic:', err)
        if (curatedTopic?.questions) {
          setQuestions(curatedTopic.questions)
          setChoices(new Array(curatedTopic.questions.length).fill(-1))
          setSource('curated')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadQuestions()
    return () => { cancelled = true }
  }, [topicName, questionCount, levelParam, curatedTopic])

  const question = questions[step]
  const choice = choices[step]
  const isCorrect = question ? question.answer === choice : false
  const hasAnswered = choices.length > 0 && choices.every(c => c !== -1)
  const answeredCount = choices.filter(c => c !== -1).length

  const next = () => {
    setStep(s => Math.min(questions.length - 1, s + 1))
    setChecked(false)
  }

  const prev = () => {
    setStep(s => Math.max(0, s - 1))
    setChecked(false)
  }

  const select = useCallback((index: number) => {
    started()
    setChoices(prevChoices => prevChoices.map((c, i) => (i === step ? index : c)))
    setChecked(false)
  }, [step])

  const submit = async () => {
    if (!hasAnswered || !questions.length) return
    const seconds = Math.round((Date.now() - start.current) / 1000)
    setLoading(true)
    setLoadingMessage(`Analyzing your answers and generating your personalized learning path with Gemini AI…`)

    try {
      const generated = await learningService.path(topicName, questions, choices, source)
      savePath({ ...generated, questions, answers: choices, source }, seconds)
      navigate(`/results/${generated.id}`)
    } catch (err) {
      console.error('Failed to generate path:', err)
      notify('Could not generate personalized path. Please try again.')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '20px',
        textAlign: 'center',
        padding: '32px'
      }}>
        <LoaderCircle size={40} className="spin" style={{ color: 'var(--color-green, #2c6e52)' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>{loadingMessage}</h2>
        <p style={{ color: 'var(--color-stone, #99968c)', maxWidth: '440px', fontSize: '14px' }}>
          We evaluate core competencies, pinpoint misconceptions, and create custom study modules and practice tailored to you.
        </p>
      </div>
    )
  }

  if (!questions.length || !question) {
    return (
      <div className="error-page">
        <h1>We couldn’t start this check-in</h1>
        <p>There was a problem loading diagnostic questions for this topic.</p>
        <Link to="/diagnostic" className="button primary">Try another topic</Link>
      </div>
    )
  }

  return (
    <>
      <Stepper current={hasAnswered ? 1 : 0} />
      <PageHeading
        eyebrow={`DIAGNOSTIC CHECK-IN (${source === 'ai' ? 'AI-ADAPTIVE' : 'CURATED'})`}
        title={topicName}
        description={`${questions.length} questions exploring core competencies. Answer honestly—this personalizes your path.`}
      />

      <div className="quiz">
        <div className="question-stepper">
          <span className="question-number">
            Question {step + 1} <span> / {questions.length}</span>
          </span>
          <span className="question-timer">
            <Clock3 size={13} />
            {answeredCount} of {questions.length} answered
          </span>
        </div>

        <div className="question-card">
          <span className="question-skill">{question.skill}</span>
          <p className="question-prompt">{question.prompt}</p>

          <Options
            options={question.options}
            selected={choice}
            onSelect={select}
            checked={checked}
            correct={question.answer}
          />

          <div className="question-footer">
            <div className="question-nav">
              <button
                className="icon-button"
                aria-label="Previous question"
                onClick={prev}
                disabled={step === 0}
              >
                <ArrowLeft size={18} />
              </button>

              {questions.map((_, i) => (
                <button
                  key={i}
                  className={`step-dot ${i === step ? 'active' : ''} ${choices[i] !== -1 ? 'answered' : ''}`}
                  onClick={() => {
                    setStep(i)
                    setChecked(false)
                  }}
                  aria-label={`Question ${i + 1}`}
                  aria-current={i === step}
                />
              ))}

              <button
                className="icon-button"
                aria-label="Next question"
                onClick={next}
                disabled={step === questions.length - 1}
              >
                <ArrowRight size={18} />
              </button>
            </div>
            <span className="question-skill">{question.skill}</span>
          </div>
        </div>

        {checked && (
          <div className={`answer-banner ${isCorrect ? 'correct' : 'incorrect'}`}>
            <span className="answer-mark">{isCorrect ? <Check size={18} /> : '×'}</span>
            <div>
              <strong>{isCorrect ? 'That’s right!' : 'Not quite'}</strong>
              <p>{question.explanation}</p>
            </div>
          </div>
        )}

        {!checked && choice !== -1 && step < questions.length - 1 && (
          <button
            className="button secondary small"
            onClick={() => {
              setChecked(true)
              if (isCorrect) {
                setTimeout(() => {
                  next()
                  setChecked(false)
                }, 1200)
              }
            }}
          >
            <Check size={15} />
            Check answer
          </button>
        )}

        {!checked && choice !== -1 && step === questions.length - 1 && (
          <button
            className="button primary"
            onClick={() => setChecked(true)}
          >
            <Check size={16} />
            Check answer
            <ArrowRight size={16} />
          </button>
        )}

        {checked && (
          <button
            className="button primary"
            onClick={step < questions.length - 1 ? next : submit}
          >
            <Sparkles size={17} />
            {step < questions.length - 1 ? 'Continue' : 'Build my personalized path'}
            <ArrowRight size={17} />
          </button>
        )}

        {!checked && hasAnswered && step === questions.length - 1 && choice !== -1 && (
          <button
            className="button primary"
            onClick={submit}
            style={{ marginTop: '12px' }}
          >
            <Sparkles size={17} />
            Generate my path now
            <ArrowRight size={17} />
          </button>
        )}
      </div>
    </>
  )
}
