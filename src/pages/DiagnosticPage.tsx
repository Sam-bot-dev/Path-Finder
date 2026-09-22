import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Brain, Compass, LoaderCircle, Search, Sparkles, Target, Zap } from 'lucide-react'
import { topics } from '../data/topics'
import { Loading, Stepper } from '../components/ui'
import { TopicIcon } from '../components/ui'
import { useState } from 'react'

export function DiagnosticPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const filtered = topics.filter(t => `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(search.toLowerCase().trim()))
  return <>
    <Stepper />
    <div className="diagnostic-welcome"><span className="eyebrow">YOUR CHECK-IN</span><h1>Let’s start with a topic</h1><p>Choose something you’d like to understand a little better. We’ll ask five warm, thoughtful questions—one for each core skill. No timer, no pressure.</p></div>
    <div className="diagnostic-search"><Search size={18} /><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a topic to explore…" aria-label="Search topics" /></div>
    <div className="diagnostic-topics">{filtered.map(topic => <button key={topic.id} className={`diagnostic-topic ${selected === topic.id ? 'is-selected' : ''}`} onClick={() => setSelected(topic.id)} aria-pressed={selected === topic.id}><span className={`diagnostic-icon tint-${topic.color}`}><TopicIcon name={topic.icon} size={28} /></span><span className="diagnostic-name">{topic.name}</span><span className="diagnostic-meta">{topic.category} · {topic.duration}</span></button>)}</div>
    <div className="diagnostic-footer"><button className="button primary" disabled={!selected} onClick={() => navigate(`/diagnostic/${selected}`)}><Sparkles size={17} />{selected ? 'Start your check-in' : 'Choose a topic first'}<ArrowRight size={17} /></button></div>
  </>
}
