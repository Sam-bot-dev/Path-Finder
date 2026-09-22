import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Award, BookOpen, CheckCircle2, Clock3, Compass, Flame, LoaderCircle, Route, Sparkles, Sprout, TrendingUp, X } from 'lucide-react'
import { useStore, todayMinutes, streakOf, progressOf } from '../lib/store'
import { PageHeading, ProgressRing } from '../components/ui'

export function Progress() {
  const { data } = useStore()
  const [range, setRange] = useState('7')
  const days = Number(range) || 7
  const today = todayMinutes(data.activities)
  const streak = streakOf(data.activities)
  const total = data.paths.length
  const completed = data.paths.filter(p => progressOf(p) === 100).length
  const practiced = data.paths.reduce((sum, p) => sum + Object.values(p.practiceScores).filter(s => s >= 50).length, 0)
  const hours = Math.floor(data.activities.reduce((sum, a) => sum + a.seconds, 0) / 3600)
  const badges = [{ title: 'First step', earned: total > 0, icon: Compass }, { title: 'Steady learner', earned: streak >= 3, icon: Flame }, { title: 'Completionist', earned: completed >= 1, icon: CheckCircle2 }, { title: 'Practice champion', earned: practiced >= 5, icon: Award }]
  const recent = [...data.activities].reverse().slice(0, 10)
  return <>
    <PageHeading eyebrow="YOUR PROGRESS" title="How you’re growing" description="Every small step counts. Here’s a calm, honest look at your learning so far." />
    <div className="progress-dashboard">
      <div className="progress-grid">
        <div className="stat-card"><div className="stat-icon"><BookOpen size={18} /></div><strong>{total}</strong><span>Learning paths</span></div>
        <div className="stat-card"><div className="stat-icon"><CheckCircle2 size={18} /></div><strong>{completed}</strong><span>Paths completed</span></div>
        <div className="stat-card"><div className="stat-icon"><Clock3 size={18} /></div><strong>{hours}</strong><span>Hours learning</span></div>
        <div className="stat-card"><div className="stat-icon"><Flame size={18} /></div><strong>{streak}</strong><span>Day streak</span></div>
      </div>
      <div className="progress-today"><div className="today-progress"><ProgressRing value={today / data.profile.goal * 100} size={72} stroke={5} color="var(--green)"><span className="today-number">{today}<small>min</small></span></ProgressRing></div><div className="today-details"><strong>{today} minutes today</strong><span>Your goal is {data.profile.goal} minutes. {today >= data.profile.goal ? 'A wonderful effort today.' : 'Every minute of focused learning is a step forward.'}</span></div></div>
      <div className="progress-badges"><h3>Badges</h3><div className="badge-list">{badges.map(({ title, earned, icon: Icon }) => <div key={title} className={`badge-chip ${earned ? 'earned' : ''}`}><Icon size={16} /><span>{title}</span></div>)}</div></div>
      <div className="progress-activity"><div className="activity-header"><h3>Recent activity</h3><label className="sort-select"><select value={range} onChange={e => setRange(e.target.value)} aria-label="Activity range"><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></label></div>{recent.length ? <div className="activity-list">{recent.map(a => <div key={a.id} className="activity-item"><div className="activity-icon"><TrendingUp size={14} /></div><div className="activity-info"><strong>{a.label}</strong><span>{new Date(a.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {Math.round(a.seconds / 60)} min</span></div></div>)}</div> : <div className="activity-empty"><span>No activity yet.</span><Link to="/topics" className="text-link">Start exploring<ArrowRight size={14} /></Link></div>}</div>
      <div className="progress-quick"><h3>Quick actions</h3><div className="quick-actions"><Link to="/topics" className="button secondary"><Compass size={16} />Explore topics<ArrowRight size={16} /></Link><Link to="/paths" className="button secondary"><Route size={16} />My paths<ArrowRight size={16} /></Link></div></div>
    </div>
  </>
}
