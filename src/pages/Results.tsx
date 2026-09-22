import { useParams, Link } from 'react-router-dom'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { useStore } from '../lib/store'
import { Modal, ProgressRing, Stepper } from '../components/ui'
import { useState } from 'react'

export function Results() {
  const { pathId } = useParams<{ pathId: string }>()
  const { data } = useStore()
  const path = data.paths.find(p => p.id === pathId)
  const [learnMore, setLearnMore] = useState(false)
  if (!path) return (
    <div className="error-page">
      <h1>Path not found</h1>
      <p>The page you are looking for has moved or does not exist.</p>
      <Link to="/" className="button primary">Explore topics</Link>
    </div>
  )
  const correct = path.answers.filter((a, i) => path.questions[i].answer === a).length
  const percent = Math.round(correct / path.questions.length * 100)
  return (
    <>
      <Stepper current={2} />
      <div className="results">
        <div className="results-header">
          <span className="eyebrow">YOUR RESULTS</span>
          <h1>Great work finishing your check-in</h1>
          <p>Here is what we learned from your answers. Your path is ready when you are.</p>
        </div>
        <div className="score-grid">
          <div className="score-card">
            <div className="score-left">
              <ProgressRing value={percent} size={80} stroke={5}>
                <span className="score-number">{correct}<span>/{path.questions.length}</span></span>
              </ProgressRing>
            </div>
            <div className="score-right">
              <h2>You got <strong>{correct} right</strong> out of {path.questions.length}</h2>
              <p>{percent === 100 ? 'A confident start! Your personalized path keeps what you know fresh and introduces advanced practical applications.' : percent >= 60 ? 'A strong foundation with clear focus areas. Your path balances confidence with targeted deep dives.' : 'Every expert was once a beginner. Your personalized path starts gently and builds foundations carefully.'}</p>
            </div>
          </div>
        </div>
        <div className="results-skills">
          <h3>How each skill looks</h3>
          <div className="skill-status-list">
            {path.questions.map((q, i) => {
              const isCorrect = q.answer === path.answers[i]
              return (
                <div key={q.id} className={`skill-status ${isCorrect ? 'strong' : 'needs-work'}`}>
                  <div className="skill-status-mark"><Check size={13} /></div>
                  <div className="skill-status-label">
                    <strong>{q.skill}</strong>
                    <span>{isCorrect ? 'You are building strong foundations here.' : 'Let us spend a little more time together on this.'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="path-preview">
          <h3>Your personalized path</h3>
          <div className="path-modules">
            {path.modules.map((module, i) => (
              <div key={module.id} className={`path-module ${module.focus ? 'is-focus' : 'is-known'}`}>
                <span className="path-module-number">0{i + 1}</span>
                <div className="path-module-body">
                  <strong>{module.title}</strong>
                  <span>{module.focus ? 'A focused lesson with extra practice' : 'A quick refresher and a fresh example'}</span>
                </div>
                <Link to={`/path/${path.id}`} className="text-link">Start<ArrowRight size={13} /></Link>
              </div>
            ))}
          </div>
        </div>
        <div className="results-actions">
          <Link to={`/path/${path.id}`} className="button primary"><Sparkles size={16} />Start your learning path<ArrowRight size={16} /></Link>
          <button className="button secondary" onClick={() => setLearnMore(true)}>Learn how your path works<ArrowRight size={16} /></button>
        </div>
      </div>
      {learnMore && (
        <Modal title="How your learning path works" onClose={() => setLearnMore(false)} className="help-modal">
          <div className="modal-heading">
            <span className="eyebrow">MADE FOR YOU</span>
            <h2>Your path is built around your answers</h2>
          </div>
          <p>We ask five simple questions about the core skills in your topic. For every skill you already know, we give a quick refresher. For everything else, we offer a gentle, focused lesson with real examples and practice questions.</p>
          <p>Your path stays in a sensible learning order. Each module includes a short lesson, a practical example, two practice questions, and a curated resource so you always know where to go next.</p>
          <p>You can retake the check-in anytime. We save your best progress and keep your practice scores so you can see how you grow.</p>
        </Modal>
      )}
    </>
  )
}
