import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, BookOpen, Bookmark, BookmarkCheck, Brain, Check, ChevronDown, Code2, Compass, Infinity, Leaf, LoaderCircle, Search, Sparkles, Sprout, Target, Zap } from 'lucide-react'
import { useStore } from '../lib/store'
import { topics } from '../data/topics'
import { Brand, Loading, Modal, TopicIcon } from '../components/ui'
import { TopicBrowser, TopicCard } from '../components/TopicBrowser'
import type { Topic } from '../lib/types'

const popular = [topics[0], topics[1], topics[4], topics[3], topics[5], topics[2]]
const features = [{ title: 'A kind place to start', description: 'No pressure, no grades. Just questions that help us understand where you are—so we can build a path that fits.', icon: Compass }, { title: 'Personalized by you', description: 'Your answers shape every lesson. The topics you know get a quick refresher. The ones you don’t get the time they deserve.', icon: Brain }, { title: 'Learn at your pace', description: 'Small lessons, clear examples, and practice that sticks. Take a break anytime. Your progress is always waiting.', icon: Sprout }]

export function Landing() {
  const { data, toggleTopic } = useStore()
  const [sampleTopic, setSampleTopic] = useState<Topic | null>(null)
  return <div className="landing">
    <div className="landing-bar"><div className="landing-bar-inner"><Brand /></div></div>
    <section className="landing-hero">
      <div className="hero-main">
        <span className="eyebrow">YOUR PERSONAL LEARNING GUIDE</span>
        <h1>Start with a question.<br />End with understanding.</h1>
        <p>A personalized learning space that meets you where you are and grows with you—one small step at a time.</p>
        <div className="hero-actions"><Link to="/topics" className="button primary"><Sparkles size={16} />Explore something new<ArrowRight size={16} /></Link><Link to="/diagnostic" className="button secondary"><Target size={16} />Take a quick check-in<ArrowRight size={16} /></Link></div>
        <div className="hero-trust"><Check size={13} /><span>5 quick questions per topic</span><Check size={13} /><span>Personalized in seconds</span><Check size={13} /><span>Practice that actually teaches</span></div>
      </div>
      <div className="hero-visual"><div className="hero-visual-inner"><img src="/images/learning-journey.png" alt="" loading="eager" width="600" height="400" /></div></div>
    </section>
    <div className="down-arrow"><ChevronDown size={24} /></div>
    <section className="landing-explore"><div className="explore-heading"><h2>What sparks your curiosity?</h2><p>Big ideas start with a small first step. Pick yours.</p></div><div className="topic-browser"><div className="topic-grid"><div className="topic-col-left"><TopicCard topic={popular[0]} /></div><div className="topic-col-right"><div className="topic-row"><TopicCard topic={popular[1]} /><TopicCard topic={popular[2]} /></div><div className="topic-row"><TopicCard topic={popular[3]} /><TopicCard topic={popular[4]} /></div></div></div></div><div className="explore-all"><Link to="/topics" className="button secondary"><Search size={16} />See all topics<ArrowRight size={16} /></Link></div></section>
    <section className="landing-how-it-works" id="how-it-works"><div className="how-heading"><h2>How it works</h2><p>We made getting started feel effortless. Three steps from curious to learning.</p></div><div className="how-cards">{[{ icon: Target, title: 'Find your starting point', description: 'Pick a topic that interests you. We’ll ask five warm, thoughtful questions—one for each core skill. No timer, no pressure. Take as much time as you need.' }, { icon: Sparkles, title: 'See your path take shape', description: 'We read your answers carefully. Skills you already know become quick refreshers. Skills you missed become focused, well-paced lessons with real examples.' }, { icon: Sprout, title: 'Learn and practice, every step', description: 'Explore short lessons, real-world examples, and practice questions that show your thinking. Save anything useful. Track your journey. Celebrate progress.' }].map(({ icon: Icon, title, description }) => <div key={String(title)} className="how-card"><div className="how-card-icon"><Icon size={26} strokeWidth={1.65} /></div><h3>{title}</h3><p>{description}</p></div>)}</div></section>
    <section className="landing-features"><div className="features-heading"><h2>A workspace built for focused minds</h2><p>Calm, clear, and designed to keep you moving forward—without distraction or overwhelm.</p></div><div className="features-grid">{features.map(({ title, description, icon: Icon }) => <div key={title} className="feature-card"><div className="feature-icon"><Icon size={24} strokeWidth={1.65} /></div><h3>{title}</h3><p>{description}</p></div>)}<div className="feature-card feature-wide"><div className="feature-card-inner"><div className="feature-icon"><BookOpen size={24} strokeWidth={1.65} /></div><h3>Real resources, real understanding</h3><p>We point you to educational videos, trustworthy textbooks, and curated reference pages. Your learning path always includes a concrete next step.</p></div></div></div></section>
    <section className="landing-cta"><div className="cta-card"><h2>Your journey starts with a single step.</h2><p>Pick a topic. Answer a few warm questions. Watch a path appear that fits just for you.</p><Link to="/topics" className="button primary"><Sparkles size={17} />Start something new<ArrowRight size={17} /></Link></div></section>
    <footer className="landing-footer"><div><Brand small /><span>LearnPath AI is a personal learning space for curious minds.</span></div><div className="landing-footer-links"><Link to="/topics">All topics</Link><Link to="/settings">Settings</Link></div></footer>
    {sampleTopic && <Modal title={sampleTopic.name} onClose={() => setSampleTopic(null)} className="sample-modal"><div className="sample-modal-content"><div className={`topic-icon tint-${sampleTopic.color}`}><TopicIcon name={sampleTopic.icon} size={36} /></div><h2>{sampleTopic.name}</h2><p>{sampleTopic.description}</p><div className="sample-tags"><span className="tag">{sampleTopic.category}</span><span className="tag">{sampleTopic.level}</span><span className="tag">{sampleTopic.duration}</span></div><div className="sample-skills"><span className="sample-heading">What you’ll discover</span><div className="sample-skill-list">{sampleTopic.questions.map(q => <span className="skill-chip" key={q.id}>{q.skill}</span>)}</div></div><div className="sample-footer"><button className="button secondary small" onClick={() => { toggleTopic(sampleTopic.id); setSampleTopic(null) }}>{data.savedTopics.includes(sampleTopic.id) ? <><BookmarkCheck size={15} />Saved</> : <><Bookmark size={15} />Save</>}</button><Link to={`/learn/${sampleTopic.id}`} className="button primary small" onClick={() => setSampleTopic(null)}>Start learning<ArrowRight size={15} /></Link></div></div></Modal>}
  </div>
}
