import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, BookOpen, CheckCircle2, Clock3, Code2, Play, PlayCircle, Sparkles, Target } from 'lucide-react'
import { getTopic } from '../data/topics'
import { useStore } from '../lib/store'
import { Brand, Loading, Stepper } from '../components/ui'
import { TopicIcon } from '../components/ui'

export function TopicPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const topic = getTopic(topicId || '')
  const { data, toggleTopic } = useStore()
  const navigate = useNavigate()
  if (!topic) return <div className="error-page"><h1>We couldn’t find this topic</h1><p>The page you’re looking for has moved or doesn’t exist.</p><Link to="/" className="button primary">Explore topics</Link></div>
  const [questionCount, setQuestionCount] = useState(5)
  const saved = data.savedTopics.includes(topic.id)
  const path = data.paths.find(p => p.topicId === topic.id)
  return <>
    <div className="back-nav"><button className="back-button" onClick={() => navigate(-1)}><ArrowLeft size={16} />Back</button></div>
    <div className="topic-hero"><span className="eyebrow">YOUR NEXT DISCOVERY</span><h1>{topic.name}</h1><p>{topic.description}</p><div className="topic-hero-tags"><span className={`tag tag-${topic.color}`}>{topic.category}</span><span className="tag">{topic.level}</span><span className="tag">{topic.duration}</span></div></div>
    <div className="topic-actions">
      <button className="button secondary small" onClick={() => toggleTopic(topic.id)}>{saved ? <><BookmarkCheck size={15} />Saved</> : <><Bookmark size={15} />Save topic</>}</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-sand, #efe8dd)', padding: '3px 8px', borderRadius: '20px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-stone, #99968c)' }}>Length:</span>
        {[5, 7, 10].map(cnt => (
          <button key={cnt} type="button" onClick={() => setQuestionCount(cnt)} style={{ border: 'none', background: questionCount === cnt ? 'var(--color-green, #2c6e52)' : 'transparent', color: questionCount === cnt ? '#fff' : 'var(--color-ink, #2e2a24)', borderRadius: '10px', padding: '2px 7px', fontSize: '11px', cursor: 'pointer', fontWeight: 500 }}>{cnt} Qs</button>
        ))}
      </div>
      <Link to={`/diagnostic/${topic.id}?count=${questionCount}`} className="button primary"><Sparkles size={17} />{path ? 'Retake check-in' : `Take check-in (${questionCount} Qs)`}<ArrowRight size={17} /></Link>
    </div>
    <section className="topic-preview"><h2>What you’ll discover</h2><div className="skill-cards">{topic.questions.map((q, i) => <div className="skill-card" key={q.id}><div className="skill-icon"><span>{i + 1}</span></div><span className="skill-title">{q.skill}</span></div>)}</div></section>
    {!!path && <div className="topic-resume"><div className="resume-card"><BookOpen size={18} /><span>You have an active learning path for this topic. <Link to={`/path/${path.id}`}>Continue your journey<ArrowRight size={14} /></Link></span></div></div>}
    <section className="topic-resources"><h2>Learning resources</h2><div className="resource-cards">{topic.lessons.map(l => <div className="resource-card" key={l.id}><div className="resource-card-top"><span className="resource-number">0{topic.lessons.indexOf(l) + 1}</span><span className="resource-duration"><Clock3 size={13} />{l.minutes} min</span></div><h3>{l.title}</h3><p>{l.description}</p><div className="resource-card-footer"><a href={l.resourceUrl} target="_blank" rel="noopener noreferrer" className="text-link">{l.resourceLabel}<ArrowRight size={14} /></a></div></div>)}</div></section>
  </>
}
