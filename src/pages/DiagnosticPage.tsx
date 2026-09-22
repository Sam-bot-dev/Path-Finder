import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Brain, Sparkles, Search, Sliders, CheckCircle2, BookOpen } from 'lucide-react'
import { topics } from '../data/topics'
import { Stepper, TopicIcon } from '../components/ui'

const SUGGESTIONS = [
  'Quantum Computing & Qubits',
  'React Hooks & State Architecture',
  'Organic Chemistry Reactions',
  'Linear Algebra & Matrices',
  'Cellular Respiration & Bioenergetics',
  'Macroeconomics & Monetary Policy',
  'World War II Pacific Theater',
  'Python Data Analysis with Pandas'
]

export function DiagnosticPage() {
  const [customTopic, setCustomTopic] = useState('')
  const [questionCount, setQuestionCount] = useState<number>(5)
  const [difficulty, setDifficulty] = useState<string>('Intermediate')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const handleStartCustom = (e: React.FormEvent) => {
    e.preventDefault()
    const topicToStart = customTopic.trim()
    if (!topicToStart) return
    navigate(`/diagnostic/custom?topic=${encodeURIComponent(topicToStart)}&count=${questionCount}&level=${encodeURIComponent(difficulty)}`)
  }

  const handleSelectCurated = (topicId: string) => {
    setSelectedTopicId(topicId)
  }

  const handleStartCurated = () => {
    if (!selectedTopicId) return
    navigate(`/diagnostic/${selectedTopicId}?count=${questionCount}`)
  }

  const filtered = topics.filter(t =>
    `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(search.toLowerCase().trim())
  )

  return (
    <>
      <Stepper current={0} />
      <div className="diagnostic-welcome">
        <span className="eyebrow">DIAGNOSTIC CHECK-IN</span>
        <h1>What would you like to master today?</h1>
        <p>
          Enter any topic or select a subject below. Answer 5–10 diagnostic questions, and our Gemini-powered engine will build your personalized learning path with targeted resources, tailored exercises, and a progress tracker.
        </p>
      </div>

      {/* Interactive Custom Topic Generator */}
      <div className="custom-diagnostic-card" style={{
        background: 'var(--color-card, #fff)',
        border: '1px solid var(--color-line, #e5e1d9)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 4px 20px rgba(46, 42, 36, 0.04)'
      }}>
        <form onSubmit={handleStartCustom}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Sparkles size={18} style={{ color: 'var(--color-sage, #4a5d42)' }} />
            <h2 style={{ fontSize: '17px', fontWeight: 600, margin: 0 }}>Start a Custom Topic Check-in</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <input
              type="text"
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              placeholder="Type any subject (e.g., Quantum Computing, Cell Biology, French Grammar, React...)"
              style={{
                flex: '1 1 300px',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid var(--color-clay, #d6cfc1)',
                fontSize: '15px',
                outline: 'none',
                background: 'var(--color-ivory, #fffdf4)',
                color: 'var(--color-ink, #2e2a24)'
              }}
              required
            />

            <button
              type="submit"
              className="button primary"
              disabled={!customTopic.trim()}
              style={{ padding: '12px 24px' }}
            >
              <Sparkles size={16} />
              Generate Diagnostic ({questionCount} Qs)
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Configuration: 5-10 Questions & Difficulty */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-line, #e5e1d9)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-soot, #433f37)' }}>
                Questions:
              </span>
              {[5, 6, 7, 8, 10].map(count => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: questionCount === count ? 'var(--color-green, #2c6e52)' : 'var(--color-clay, #d6cfc1)',
                    background: questionCount === count ? 'var(--color-green, #2c6e52)' : 'transparent',
                    color: questionCount === count ? '#fff' : 'var(--color-ink, #2e2a24)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {count} questions
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-soot, #433f37)' }}>
                Level:
              </span>
              {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: difficulty === lvl ? 'var(--color-sage, #4a5d42)' : 'var(--color-clay, #d6cfc1)',
                    background: difficulty === lvl ? 'var(--color-sand, #efe8dd)' : 'transparent',
                    color: 'var(--color-ink, #2e2a24)',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Suggestion Pills */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-stone, #99968c)' }}>Try:</span>
            {SUGGESTIONS.slice(0, 5).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setCustomTopic(s)}
                style={{
                  fontSize: '12px',
                  background: 'var(--color-parchment, #f6f3ef)',
                  border: '1px solid var(--color-line, #e5e1d9)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  color: 'var(--color-soot, #433f37)',
                  cursor: 'pointer'
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Curated Topics Section */}
      <div style={{ marginTop: '36px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '6px' }}>Or pick a curated topic</h2>
        <p style={{ fontSize: '14px', color: 'var(--color-stone, #99968c)' }}>
          Start instantly with hand-crafted foundational subject tracks.
        </p>
      </div>

      <div className="diagnostic-search">
        <Search size={18} />
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter curated topics…"
          aria-label="Search topics"
        />
      </div>

      <div className="diagnostic-topics">
        {filtered.map(topic => (
          <button
            key={topic.id}
            className={`diagnostic-topic ${selectedTopicId === topic.id ? 'is-selected' : ''}`}
            onClick={() => handleSelectCurated(topic.id)}
            aria-pressed={selectedTopicId === topic.id}
          >
            <span className={`diagnostic-icon tint-${topic.color}`}>
              <TopicIcon name={topic.icon} size={28} />
            </span>
            <span className="diagnostic-name">{topic.name}</span>
            <span className="diagnostic-meta">{topic.category} · {topic.duration}</span>
          </button>
        ))}
      </div>

      <div className="diagnostic-footer">
        <button
          className="button primary"
          disabled={!selectedTopicId}
          onClick={handleStartCurated}
        >
          <Sparkles size={17} />
          {selectedTopicId ? `Start check-in (${questionCount} questions)` : 'Select a curated topic or enter one above'}
          <ArrowRight size={17} />
        </button>
      </div>
    </>
  )
}
