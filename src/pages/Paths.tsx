import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Check, Clock3, LoaderCircle, Route, Sparkles } from 'lucide-react'
import { useStore, progressOf } from '../lib/store'
import { Brand, EmptyState, PageHeading, ProgressRing } from '../components/ui'

export function Paths() {
  const { data } = useStore()
  if (!data.paths.length) return <div className="empty-state-wrapper"><EmptyState icon={<Route size={36} />} title="Your learning paths will live here" description="Pick a topic and take a short check-in. A personalized path will appear right here—ready when you are."><Link to="/topics" className="button primary"><Sparkles size={16} />Explore topics<ArrowRight size={16} /></Link></EmptyState></div>
  return <>
    <PageHeading eyebrow="YOUR LEARNING PATHS" title="Continue your journey" description="Every path you’ve started is saved here. Pick up exactly where you left off." />
    <div className="path-list">{data.paths.map(path => {
      const progress = progressOf(path)
      return <article className="path-card" key={path.id}><div className="path-card-main"><Link to={`/path/${path.id}`} className="path-card-link"><span className="path-topic">{path.topicName}</span><span className="path-status">{progress === 100 ? 'Completed' : progress > 0 ? 'In progress' : 'New path'}</span></Link><div className="path-card-progress"><ProgressRing value={progress} size={48} stroke={4} color="var(--green)" /></div></div><div className="path-card-footer"><span><Clock3 size={13} />{path.modules.length} modules</span><span><Check size={13} />{path.read.length} / {path.modules.length} explored</span><Link to={`/path/${path.id}`} className="text-link">Continue learning<ArrowRight size={13} /></Link></div></article>
    })}</div>
  </>
}
