import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Clock3, Compass, ExternalLink, LoaderCircle, PlayCircle, Sparkles, Target, X } from 'lucide-react'
import { useStore, progressOf } from '../lib/store'
import { videoService } from '../lib/services'
import { Loading, Modal, PageHeading, ProgressRing } from '../components/ui'
import type { Lesson, Video } from '../lib/types'

function LearningModule({ pathId, module, index, active, onOpen, onClose, onRead }: { pathId: string; module: Lesson; index: number; active: boolean; onOpen: () => void; onClose: () => void; onRead: (id: string) => void }) {
  const { data, readLesson, toggleResource } = useStore()
  const [videos, setVideos] = useState<Video[]>([])
  const [busy, setBusy] = useState(false)
  const [resourceOpen, setResourceOpen] = useState(false)
  const resourceRef = useRef<HTMLDivElement>(null)
  const readTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const readRef = useRef(false)
  const moduleRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!active || readRef.current) return
    readTimer.current = setTimeout(() => { readRef.current = true; onRead(module.id) }, 12000)
    return () => { if (readTimer.current) clearTimeout(readTimer.current) }
  }, [active, module.id, onRead])
  const savedResource = data.savedResources.some(r => r.id === `${pathId}-${module.id}`)
  useEffect(() => {
    if (!resourceOpen) return
    const close = (event: MouseEvent) => { if (!resourceRef.current?.contains(event.target as Node)) setResourceOpen(false) }
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setResourceOpen(false) }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', key) }
  }, [resourceOpen])
  return (
    <>
      <div ref={moduleRef} className={`module-row ${active ? 'is-active' : ''} ${data.paths.find(p => p.id === pathId)?.read.includes(module.id) ? 'is-read' : ''}`}>
        <button className="module-toggle" onClick={onOpen} aria-expanded={active}>
          <span className="module-number">{index < 9 ? `0${index + 1}` : index + 1}</span>
          <div className="module-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <strong>{module.title}</strong>
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '1px 8px',
                borderRadius: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: module.focus ? '#fef3c7' : '#dcfce7',
                color: module.focus ? '#92400e' : '#166534',
                border: `1px solid ${module.focus ? '#fde68a' : '#bbf7d0'}`
              }}>
                {module.focus ? 'Targeted Focus' : 'Refresher'}
              </span>
            </div>
            <span>{module.description} · <Clock3 size={12} />{module.minutes} min</span>
          </div>
          <span className="module-chevron">{active ? <X size={17} /> : <ArrowRight size={17} />}</span>
        </button>
        {active && (
          <div className="module-content">
            <div className="lesson-content">
              {module.content.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
              <div className="lesson-example">
                <span className="example-title">{module.example.title}</span>
                <p>{module.example.text}</p>
              </div>
            </div>
            <div className="lesson-footer">
              <button className="icon-button save-resource" aria-label={`${savedResource ? 'Unsave' : 'Save'} resource`} aria-pressed={savedResource} onClick={() => toggleResource({ id: `${pathId}-${module.id}`, pathId, lessonId: module.id, title: module.title, topic: data.paths.find(p => p.id === pathId)?.topicName || '' })}>
                {savedResource ? <Check size={16} /> : <BookOpen size={16} />}{savedResource ? 'Saved' : 'Save resource'}
              </button>
              <div className="resource-popover-wrapper">
                <button className="text-link resource-toggle" onClick={() => { if (!videos.length && !busy) { setBusy(true); videoService.search(module.videoQuery).then(v => { setVideos(v); setBusy(false) }).catch(() => setBusy(false)) } setResourceOpen(!resourceOpen) }}>
                  Explore more resources{resourceOpen ? <X size={13} /> : <ArrowRight size={13} />}
                </button>
                {resourceOpen && (
                  <div ref={resourceRef} className="resource-popover">
                    {busy && <div className="popover-loading"><LoaderCircle size={16} className="spin" />Looking for resources…</div>}
                    {!busy && videos.map(video => (
                      <a key={video.id} href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="resource-popover-item">
                        <div className="popover-video-thumb"><img src={video.thumbnail} alt="" loading="lazy" width="120" height="68" /></div>
                        <div className="popover-video-info"><strong>{video.title}</strong><span>{video.channel}</span></div>
                        <PlayCircle size={14} />
                      </a>
                    ))}
                    {!busy && !videos.length && <div className="popover-empty">No videos found for this topic. <br />Try exploring the main resource link below.</div>}
                    <a className="popover-link" href={module.resourceUrl} target="_blank" rel="noopener noreferrer">{module.resourceLabel}<ExternalLink size={12} /></a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export function LearningPath() {
  const { pathId } = useParams<{ pathId: string }>()
  const navigate = useNavigate()
  const { data, readLesson } = useStore()
  const path = data.paths.find(p => p.id === pathId)
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const handleRead = useCallback((lessonId: string) => { if (!pathId) return; readLesson(pathId, lessonId, 15) }, [pathId, readLesson])
  if (!path) return <div className="error-page"><h1>Path not found</h1><p>The page you are looking for has moved or does not exist.</p><Link to="/" className="button primary">Explore topics</Link></div>
  const progress = progressOf(path)
  const somePractice = path.modules.some(module => path.practiceScores[module.id] !== undefined)
  return (
    <>
      <PageHeading eyebrow="YOUR LEARNING PATH" title={path.topicName} description="A clear route through the ideas that matter most. Open a module and take it one step at a time." />
      <div className="path-summary">
        <div className="path-progress">
          <ProgressRing value={progress} color="var(--green)" stroke={5} size={56}><strong>{progress}%</strong></ProgressRing>
          <div className="path-progress-info"><strong>{path.completed.length} / {path.modules.length}</strong><span>modules completed</span></div>
        </div>
        <span className="path-sep" />
        <div className="path-summary-label"><strong>{path.score}%</strong><span>Check-in score</span></div>
      </div>
      <div className="path-timeline">
        {path.modules.map((module, i) => (
          <LearningModule key={module.id} pathId={path.id} module={module} index={i} active={activeModule === module.id} onOpen={() => setActiveModule(activeModule === module.id ? null : module.id)} onClose={() => setActiveModule(null)} onRead={handleRead} />
        ))}
      </div>
      <div className="path-footer">
        <Link to={`/practice/${path.id}`} className="button primary"><Sparkles size={16} />{somePractice ? 'Continue practice' : 'Start practice'}<ArrowRight size={16} /></Link>
        <Link to={`/diagnostic/custom?topic=${encodeURIComponent(path.topicName)}&count=${path.questions.length}`} className="button secondary"><Target size={16} />Retake check-in<ArrowRight size={16} /></Link>
      </div>
    </>
  )
}
