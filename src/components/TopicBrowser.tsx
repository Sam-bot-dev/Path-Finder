import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, Bookmark, Check, Clock3, Search, SlidersHorizontal, X } from 'lucide-react'
import { categories, topics } from '../data/topics'
import { useStore } from '../lib/store'
import type { Category, Topic } from '../lib/types'
import { TopicIcon } from './ui'

export function TopicCard({ topic }: { topic: Topic }) {
  const { data, toggleTopic } = useStore()
  const saved = data.savedTopics.includes(topic.id)
  const path = data.paths.find(p => p.topicId === topic.id)
  return <article className={`topic-card topic-${topic.color}`}><div className="topic-card-top"><Link className={`topic-icon tint-${topic.color}`} to={`/learn/${topic.id}`} aria-label={`Explore ${topic.name}`}><TopicIcon name={topic.icon} /></Link><span className="topic-category">{topic.category}</span><button className={`save-topic ${saved ? 'is-saved' : ''}`} aria-label={`${saved ? 'Unsave' : 'Save'} ${topic.name}`} aria-pressed={saved} onClick={() => toggleTopic(topic.id)}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.65} /></button></div><Link className="topic-main-link" to={`/learn/${topic.id}`}><h3>{topic.name}</h3><p>{topic.description}</p></Link><div className="topic-card-bottom"><span><i className={`level-dot ${path ? 'started' : ''}`} />{path ? 'Your journey has started' : topic.level}</span><Link to={path ? `/path/${path.id}` : `/learn/${topic.id}`} className="topic-arrow" aria-label={path ? `Continue ${topic.name}` : `Start ${topic.name}`}><ArrowRight size={17} /></Link></div></article>
}
export function TopicBrowser({ full = false }: { full?: boolean }) {
  const [category, setCategory] = useState<Category>('All topics')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recommended')
  const filtered = topics.filter(t => (category === 'All topics' || t.category === category) && `${t.name} ${t.category} ${t.description} ${t.questions.map(q => q.skill).join(' ')}`.toLowerCase().includes(search.toLowerCase().trim()))
  if (sort === 'alphabetical') filtered.sort((a, b) => a.name.localeCompare(b.name))
  return <section id="topics" className="topic-browser"><div className="section-heading"><div><h2>{full ? 'Find your next discovery' : 'What sparks your curiosity?'}</h2><p>{full ? 'Choose something you’d love to understand a little better.' : 'Big ideas start with a small first step. Pick yours.'}</p></div><div className="topic-search"><Search size={17} /><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Find a topic…" aria-label="Search topics" />{search && <button className="search-clear" onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}<span className="search-key">⌕</span></div></div><div className="topic-controls"><div className="category-tabs" role="group" aria-label="Filter topics by subject">{categories.map(c => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)} aria-pressed={category === c}>{c === 'All topics' && <SlidersHorizontal size={13} />}{c}{c === 'All topics' && <span>{topics.length}</span>}</button>)}</div>{full && <label className="sort-select"><ArrowDown size={14} /><select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort topics"><option value="recommended">Recommended</option><option value="alphabetical">A–Z</option></select></label>}</div><div className="topic-grid">{filtered.map(topic => <TopicCard topic={topic} />)}</div>{filtered.length === 0 && <div className="search-empty"><Search size={30} /><h3>A new discovery is just around the corner.</h3><p>No topics match “{search}” in {category.toLowerCase()}. Try another word or subject.</p><button className="button secondary small" onClick={() => { setSearch(''); setCategory('All topics') }}>Show all topics</button></div>}<div className="topic-caption"><span><Check size={13} /> No pressure, no grades. Just a great place to start.</span><span><Clock3 size={13} /> 5 questions · About 3 minutes</span></div></section>
}
