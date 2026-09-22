import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, ChevronUp, Clock3, Compass, ExternalLink, LoaderCircle, PlayCircle, Sparkles, Target, Video as VideoIcon, X } from 'lucide-react'
import { useStore, progressOf } from '../lib/store'
import { videoService } from '../lib/services'
import { Loading, Modal, PageHeading, ProgressRing } from '../components/ui'
import type { Lesson, Video, ExtraResourcesResult } from '../lib/types'

function formatExternalUrl(url?: string): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

function LearningModule({ pathId, module, index, active, onOpen, onClose, onRead }: { pathId: string; module: Lesson; index: number; active: boolean; onOpen: () => void; onClose: () => void; onRead: (id: string) => void }) {
  const { data, readLesson, toggleResource } = useStore()
  const [extraData, setExtraData] = useState<ExtraResourcesResult | null>(null)
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
              <button
                className="icon-button save-resource"
                aria-label={`${savedResource ? 'Unsave' : 'Save'} resource`}
                aria-pressed={savedResource}
                onClick={() =>
                  toggleResource({
                    id: `${pathId}-${module.id}`,
                    pathId,
                    lessonId: module.id,
                    title: module.title,
                    topic: data.paths.find(p => p.id === pathId)?.topicName || ''
                  })
                }
              >
                {savedResource ? <Check size={16} /> : <BookOpen size={16} />}
                {savedResource ? 'Saved' : 'Save resource'}
              </button>

              <button
                className="text-link resource-toggle"
                onClick={() => {
                  if (!extraData && !busy) {
                    setBusy(true)
                    videoService
                      .search(module.videoQuery || `${module.title} tutorial`)
                      .then(res => {
                        setExtraData(res)
                        setBusy(false)
                      })
                      .catch(() => setBusy(false))
                  }
                  setResourceOpen(!resourceOpen)
                }}
              >
                {resourceOpen ? 'Hide extra resources' : 'Explore more resources'}
                {resourceOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {resourceOpen && (
              <div className="resources-expansion-panel">
                <div className="resources-panel-header">
                  <span className="resources-panel-title">
                    <Sparkles size={14} /> Recommended Learning Resources
                  </span>
                  <button
                    className="icon-button small-close-btn"
                    onClick={() => setResourceOpen(false)}
                    aria-label="Close resources panel"
                  >
                    <X size={14} />
                  </button>
                </div>

                {busy && (
                  <div className="resources-loading">
                    <LoaderCircle size={16} className="spin" />
                    <span>Finding educational tutorials, verified videos, and documentation…</span>
                  </div>
                )}

                {/* Real Verified Educational YouTube Videos */}
                {!busy && extraData && extraData.videos.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-stone)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                      Recommended Video Tutorials
                    </div>
                    <div className="resources-video-grid">
                      {extraData.videos.map(video => {
                        const videoUrl = formatExternalUrl(video.url || (video.id ? `https://youtube.com/watch?v=${video.id}` : ''))
                        return (
                          <a
                            key={video.id}
                            href={videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="resource-card-video"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (videoUrl) {
                                window.open(videoUrl, '_blank', 'noopener,noreferrer')
                              }
                            }}
                          >
                            <div className="resource-card-thumb">
                              <img src={video.thumbnail} alt="" loading="lazy" referrerPolicy="no-referrer" />
                              <div className="resource-card-play">
                                <PlayCircle size={20} />
                              </div>
                            </div>
                            <div className="resource-card-info">
                              <strong>{video.title}</strong>
                              <span>{video.channel}</span>
                            </div>
                          </a>
                        )
                      })}
                    </div>

                    {/* YouTube Search Direct Link */}
                    {extraData.youtubeSearchUrl && (
                      <div style={{ marginTop: '6px', marginBottom: '14px', textAlign: 'right' }}>
                        <a
                          href={formatExternalUrl(extraData.youtubeSearchUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link"
                          style={{ fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#c4302b' }}
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(formatExternalUrl(extraData.youtubeSearchUrl), '_blank', 'noopener,noreferrer')
                          }}
                        >
                          <VideoIcon size={13} />
                          Browse all related lessons on YouTube
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Web Resources & Documentation */}
                {((extraData?.resources && extraData.resources.length > 0) || module.resourceUrl) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-stone)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Official Documentation & Articles
                    </div>

                    {/* Primary Course Link */}
                    {module.resourceUrl && (
                      <a
                        href={formatExternalUrl(module.resourceUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-external-banner"
                        style={{ textDecoration: 'none', cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(formatExternalUrl(module.resourceUrl), '_blank', 'noopener,noreferrer')
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <BookOpen size={17} color="var(--color-green, #2c6e52)" />
                          <div>
                            <strong style={{ fontSize: '12px', color: 'var(--color-ink)', display: 'block' }}>
                              {module.resourceLabel || 'Primary Curriculum Guide'}
                            </strong>
                            <span style={{ fontSize: '11px', color: 'var(--color-stone)' }}>
                              Interactive course and reference material
                            </span>
                          </div>
                        </div>
                        <span className="resource-external-link">
                          Open Guide <ExternalLink size={12} />
                        </span>
                      </a>
                    )}

                    {/* Curated Extra Web Resources */}
                    {extraData?.resources?.map((res, i) => (
                      <a
                        key={i}
                        href={formatExternalUrl(res.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="resource-external-banner"
                        style={{ textDecoration: 'none', cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(formatExternalUrl(res.url), '_blank', 'noopener,noreferrer')
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Compass size={17} color="var(--color-clay, #d57351)" />
                          <div>
                            <strong style={{ fontSize: '12px', color: 'var(--color-ink)', display: 'block' }}>
                              {res.title}
                            </strong>
                            <span style={{ fontSize: '11px', color: 'var(--color-stone)' }}>
                              {res.source} · {res.description}
                            </span>
                          </div>
                        </div>
                        <span className="resource-external-link">
                          Explore <ExternalLink size={12} />
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
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
