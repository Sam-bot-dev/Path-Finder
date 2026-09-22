import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Bookmark, BookmarkCheck, ExternalLink, Route, Sparkles, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { EmptyState, PageHeading } from '../components/ui'
import { getTopic } from '../data/topics'

export function Saved() {
  const { data, toggleTopic, toggleResource } = useStore()
  const nothingSaved = !data.savedTopics.length && !data.savedResources.length
  if (nothingSaved) return <div className="empty-state-wrapper"><EmptyState icon={<Bookmark size={36} />} title="Your collection is ready and waiting" description="Save topics, lessons, and resources as you explore. They’ll appear here—organized and ready whenever you return."><Link to="/topics" className="button primary"><Sparkles size={16} />Explore topics<ArrowRight size={16} /></Link></EmptyState></div>
  return <>
    <PageHeading eyebrow="SAVED FOR LATER" title="Your collection" description="Everything you’ve saved while exploring—topics to revisit, resources to study, lessons to return to." />
    {!!data.savedTopics.length && <section className="saved-section"><h3>Saved topics</h3><div className="saved-topics">{data.savedTopics.map(id => { const topic = getTopic(id); if (!topic) return null; return <div key={id} className="saved-card"><div><span className="saved-tag">{topic.category}</span><Link to={`/learn/${topic.id}`} className="saved-title">{topic.name}</Link><p>{topic.description}</p></div><div className="saved-actions"><button className="icon-button" aria-label={`Remove ${topic.name}`} onClick={() => toggleTopic(topic.id)}><X size={15} /></button></div></div> })}</div></section>}
    {!!data.savedResources.length && <section className="saved-section"><h3>Saved resources</h3><div className="saved-resources">{data.savedResources.map(r => <div key={r.id} className="saved-resource"><div className="saved-resource-icon"><BookOpen size={16} /></div><div><span className="saved-resource-title">{r.title}</span><span className="saved-resource-meta">{r.topic}</span></div><div className="saved-resource-actions"><Link to={`/path/${r.pathId}`} className="text-link small">Continue learning<ArrowRight size={12} /></Link><button className="icon-button" aria-label="Remove resource" onClick={() => toggleResource(r)}><X size={15} /></button></div></div>)}</div></section>}
  </>
}
