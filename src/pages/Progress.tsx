import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Compass,
  Flame,
  Route,
  Sparkles,
  TrendingUp,
  Brain,
  Target
} from 'lucide-react'
import { useStore, todayMinutes, streakOf, progressOf } from '../lib/store'
import { PageHeading, ProgressRing } from '../components/ui'

export function Progress() {
  const { data } = useStore()
  const [range, setRange] = useState('7')
  const today = todayMinutes(data.activities)
  const streak = streakOf(data.activities)
  const total = data.paths.length
  const completed = data.paths.filter(p => progressOf(p) === 100).length
  const practiced = data.paths.reduce((sum, p) => sum + Object.values(p.practiceScores).filter(s => s >= 50).length, 0)
  const hours = Math.floor(data.activities.reduce((sum, a) => sum + a.seconds, 0) / 3600)

  // Skill Mastery Matrix
  const assessedSkills = data.paths.flatMap(p =>
    p.questions.map((q, i) => {
      const isCorrectDiagnostic = q.answer === p.answers[i]
      const practiceScore = p.practiceScores[p.modules[i]?.id] || 0
      const isMastered = isCorrectDiagnostic || practiceScore >= 50
      return {
        id: `${p.id}-${q.id}`,
        skill: q.skill,
        topic: p.topicName,
        isMastered,
        isCorrectDiagnostic,
        practiceScore
      }
    })
  )

  const masteredSkillsCount = assessedSkills.filter(s => s.isMastered).length
  const focusSkillsCount = assessedSkills.filter(s => !s.isMastered).length

  const badges = [
    { title: 'First Diagnostic', earned: total > 0, icon: Target },
    { title: 'Steady Learner', earned: streak >= 3, icon: Flame },
    { title: 'Curriculum Master', earned: completed >= 1, icon: CheckCircle2 },
    { title: 'Practice Champion', earned: practiced >= 3, icon: Award },
    { title: 'Curious Explorer', earned: data.paths.length >= 3, icon: Compass },
    { title: 'AI Adaptive Scholar', earned: data.paths.some(p => p.source === 'ai'), icon: Brain }
  ]

  const recent = [...data.activities].reverse().slice(0, 10)

  return (
    <>
      <PageHeading
        eyebrow="YOUR PROGRESS TRACKER"
        title="Personalized Learning Analytics"
        description="Every diagnostic question, lesson read, and practice challenge shapes your adaptive growth."
      />

      <div className="progress-dashboard">
        {/* Metric Cards */}
        <div className="progress-grid">
          <div className="stat-card">
            <div className="stat-icon"><BookOpen size={18} /></div>
            <strong>{total}</strong>
            <span>Learning paths</span>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><CheckCircle2 size={18} /></div>
            <strong>{masteredSkillsCount}</strong>
            <span>Skills mastered</span>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Clock3 size={18} /></div>
            <strong>{hours}h {Math.floor((data.activities.reduce((sum, a) => sum + a.seconds, 0) % 3600) / 60)}m</strong>
            <span>Time invested</span>
          </div>
          <div className="stat-card">
            <div className="stat-icon"><Flame size={18} /></div>
            <strong>{streak}</strong>
            <span>Day streak</span>
          </div>
        </div>

        {/* Daily Goal */}
        <div className="progress-today">
          <div className="today-progress">
            <ProgressRing value={Math.min(100, (today / data.profile.goal) * 100)} size={72} stroke={5} color="var(--color-green)">
              <span className="today-number">{today}<small>min</small></span>
            </ProgressRing>
          </div>
          <div className="today-details">
            <strong>{today} of {data.profile.goal} minutes completed today</strong>
            <span>{today >= data.profile.goal ? 'Goal reached! Excellent dedication today.' : 'Keep going—small daily efforts compound into deep mastery.'}</span>
          </div>
        </div>

        {/* Active Learning Paths Tracker */}
        <div style={{
          background: 'var(--color-card, #fff)',
          border: '1px solid var(--color-line, #e5e1d9)',
          borderRadius: '16px',
          padding: '24px',
          marginTop: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, margin: 0 }}>Active Personalized Paths</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-stone, #99968c)', margin: '4px 0 0' }}>
                Your custom curriculum paths with diagnostic scores and lesson milestones.
              </p>
            </div>
            <Link to="/diagnostic" className="button primary small">
              <Sparkles size={14} />New Check-in
            </Link>
          </div>

          {data.paths.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-stone, #99968c)' }}>
              <p>No learning paths generated yet.</p>
              <Link to="/diagnostic" className="button primary small" style={{ marginTop: '10px' }}>
                Take your first diagnostic check-in
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {data.paths.map(path => {
                const pathProgress = progressOf(path)
                return (
                  <div
                    key={path.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px',
                      background: 'var(--color-ivory, #fffdf4)',
                      border: '1px solid var(--color-line, #e5e1d9)',
                      borderRadius: '12px',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ minWidth: '220px', flex: '1 1 auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '15px' }}>{path.topicName}</strong>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '8px',
                          background: path.source === 'ai' ? '#dcfce7' : '#e0e7ff',
                          color: path.source === 'ai' ? '#166534' : '#3730a3'
                        }}>
                          {path.source === 'ai' ? 'AI Adapted' : 'Curated'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-stone, #99968c)' }}>
                        Diagnostic: <strong>{path.score}%</strong> · {path.questions.length} questions · {path.completed.length} of {path.modules.length} modules done
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '100px' }}>
                        <div style={{ height: '6px', background: 'var(--color-clay, #d6cfc1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pathProgress}%`, height: '100%', background: 'var(--color-green, #2c6e52)' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--color-stone, #99968c)', display: 'block', textAlign: 'right', marginTop: '2px' }}>
                          {pathProgress}% complete
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link to={`/path/${path.id}`} className="button secondary small">
                          Study<ArrowRight size={13} />
                        </Link>
                        <Link to={`/practice/${path.id}`} className="button primary small">
                          Practice
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Skill Competency Matrix */}
        {assessedSkills.length > 0 && (
          <div style={{
            background: 'var(--color-card, #fff)',
            border: '1px solid var(--color-line, #e5e1d9)',
            borderRadius: '16px',
            padding: '24px',
            marginTop: '20px'
          }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 600, margin: 0 }}>Skill Competency Breakdown</h3>
              <p style={{ fontSize: '13px', color: 'var(--color-stone, #99968c)', margin: '4px 0 0' }}>
                Skills assessed across your diagnostics: {masteredSkillsCount} mastered, {focusSkillsCount} in focus.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
              {assessedSkills.slice(0, 12).map(skill => (
                <div
                  key={skill.id}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-line, #e5e1d9)',
                    background: skill.isMastered ? '#f0fdf4' : '#fffbeb',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: skill.isMastered ? '#22c55e' : '#f59e0b',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    {skill.isMastered ? '✓' : '!'}
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', color: 'var(--color-ink, #2e2a24)' }}>
                      {skill.skill}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--color-stone, #99968c)' }}>
                      {skill.topic} · {skill.isMastered ? 'Mastered' : 'Needs Practice'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="progress-badges">
          <h3>Achievements & Milestones</h3>
          <div className="badge-list">
            {badges.map(({ title, earned, icon: Icon }) => (
              <div key={title} className={`badge-chip ${earned ? 'earned' : ''}`}>
                <Icon size={16} />
                <span>{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="progress-activity">
          <div className="activity-header">
            <h3>Recent activity</h3>
            <label className="sort-select">
              <select value={range} onChange={e => setRange(e.target.value)} aria-label="Activity range">
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
              </select>
            </label>
          </div>
          {recent.length ? (
            <div className="activity-list">
              {recent.map(a => (
                <div key={a.id} className="activity-item">
                  <div className="activity-icon"><TrendingUp size={14} /></div>
                  <div className="activity-info">
                    <strong>{a.label}</strong>
                    <span>
                      {new Date(a.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {Math.round(a.seconds / 60)} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="activity-empty">
              <span>No activity yet.</span>
              <Link to="/diagnostic" className="text-link">Start a diagnostic check-in<ArrowRight size={14} /></Link>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="progress-quick">
          <h3>Quick actions</h3>
          <div className="quick-actions">
            <Link to="/diagnostic" className="button primary">
              <Sparkles size={16} />New Diagnostic Check-in<ArrowRight size={16} />
            </Link>
            <Link to="/paths" className="button secondary">
              <Route size={16} />Browse All Paths<ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
