import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { cloud, firebaseConfigured, type User } from './firebase'
import { isLesson, isQuestion } from './services'
import type { AppData, LearningPath, SavedResource, Activity, Profile } from './types'

const STORAGE_KEY = 'learnpath-data-v1'
export const blankData = (): AppData => ({ version: 1, profile: { name: 'Alex', goal: 20, joinedAt: new Date().toISOString() }, paths: [], savedTopics: [], savedResources: [], activities: [], updatedAt: new Date().toISOString() })
export function validData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false
  const d = value as AppData
  return d.version === 1 && !!d.profile && typeof d.profile.name === 'string' && Number.isFinite(d.profile.goal) && Array.isArray(d.paths) && d.paths.every(p => typeof p.id === 'string' && typeof p.topicId === 'string' && typeof p.topicName === 'string' && Array.isArray(p.modules) && p.modules.every(isLesson) && Array.isArray(p.questions) && p.questions.every(isQuestion) && Array.isArray(p.answers) && p.answers.every(Number.isInteger) && Array.isArray(p.completed) && Array.isArray(p.read) && !!p.practiceScores && Number.isFinite(p.score)) && Array.isArray(d.savedTopics) && d.savedTopics.every(s => typeof s === 'string') && Array.isArray(d.savedResources) && d.savedResources.every(s => typeof s.id === 'string' && typeof s.pathId === 'string' && typeof s.lessonId === 'string' && typeof s.title === 'string' && typeof s.topic === 'string') && Array.isArray(d.activities) && d.activities.every(a => typeof a.id === 'string' && typeof a.date === 'string' && Number.isFinite(a.seconds)) && typeof d.updatedAt === 'string'
}
function initialData(): AppData { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const value = JSON.parse(raw); if (validData(value)) return value } } catch { /* A blocked or corrupt browser store must not prevent learning. */ } return blankData() }

type Store = {
  data: AppData; user: User | null; sync: 'local' | 'syncing' | 'synced' | 'error'; toast: string | null;
  notify: (message: string) => void; savePath: (path: LearningPath, seconds: number) => void; toggleTopic: (id: string) => void; toggleResource: (resource: SavedResource) => void;
  readLesson: (pathId: string, lessonId: string, seconds: number) => void; completePractice: (pathId: string, lessonId: string, score: number, seconds: number) => void;
  updateProfile: (profile: Partial<Profile>) => void; importData: (data: unknown) => void; reset: () => Promise<void>; logout: () => Promise<void>;
}
const Context = createContext<Store | null>(null)
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(initialData)
  const [user, setUser] = useState<User | null>(null)
  const [sync, setSync] = useState<Store['sync']>('local')
  const [cloudReady, setCloudReady] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dataRef = useRef(data)
  const notify = useCallback((message: string) => { setToast(message); clearTimeout(noticeTimer.current); noticeTimer.current = setTimeout(() => setToast(null), 4500) }, [])
  useEffect(() => { dataRef.current = data; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { notify('Browser storage is full or unavailable. Export your progress in Settings to keep a backup.') } }, [data, notify])
  useEffect(() => cloud.watch(async current => {
    setUser(current); setCloudReady(false)
    if (!current) { setSync('local'); return }
    setSync('syncing')
    try {
      const remote = await cloud.load(current.uid)
      if (remote && validData(remote)) {
        setData(local => {
          const newer = new Date(remote.updatedAt).getTime() > new Date(local.updatedAt).getTime() ? remote : local
          const other = newer === remote ? local : remote
          return { ...newer, profile: { ...newer.profile, name: current.displayName || newer.profile.name, photoURL: current.photoURL || newer.profile.photoURL }, paths: [...newer.paths, ...other.paths.filter(p => !newer.paths.some(n => n.id === p.id))], savedTopics: [...new Set([...newer.savedTopics, ...other.savedTopics])], activities: [...newer.activities, ...other.activities.filter(a => !newer.activities.some(n => n.id === a.id))] }
        })
      } else setData(d => ({ ...d, profile: { ...d.profile, name: current.displayName || d.profile.name } }))
      setCloudReady(true); setSync('synced')
    } catch { setSync('error'); notify('Cloud sync is unavailable. Your progress is still saved on this device.') }
  }), [notify])
  useEffect(() => {
    if (!user || !cloudReady || !firebaseConfigured) return
    const timer = setTimeout(() => { setSync('syncing'); cloud.save(user.uid, data).then(() => setSync('synced')).catch(() => { setSync('error'); notify('Could not sync to the cloud. Your progress is saved on this device.') }) }, 800)
    return () => clearTimeout(timer)
  }, [data, user, cloudReady, notify])
  useEffect(() => () => clearTimeout(noticeTimer.current), [])
  const update = useCallback((fn: (d: AppData) => AppData) => setData(d => ({ ...fn(d), updatedAt: new Date().toISOString() })), [])
  const activity = (type: Activity['type'], label: string, seconds: number): Activity => ({ id: crypto.randomUUID(), date: new Date().toISOString(), type, label, seconds: Math.max(1, Math.min(3600, seconds)) })
  const value: Store = {
    data, user, sync, toast, notify,
    savePath(path, seconds) { update(d => ({ ...d, paths: [path, ...d.paths], activities: [...d.activities, activity('diagnostic', `${path.topicName} diagnostic`, seconds)] })) },
    toggleTopic(id) { update(d => ({ ...d, savedTopics: d.savedTopics.includes(id) ? d.savedTopics.filter(i => i !== id) : [...d.savedTopics, id] })); notify(data.savedTopics.includes(id) ? 'Topic removed from your collection' : 'Topic saved to your collection') },
    toggleResource(resource) { update(d => ({ ...d, savedResources: d.savedResources.some(s => s.id === resource.id) ? d.savedResources.filter(s => s.id !== resource.id) : [...d.savedResources, resource] })); notify(data.savedResources.some(s => s.id === resource.id) ? 'Resource removed from your collection' : 'Resource saved for later') },
    readLesson(pathId, lessonId, seconds) {
      const path = data.paths.find(p => p.id === pathId)
      if (!path || path.read.includes(lessonId)) return
      const module = path.modules.find(m => m.id === lessonId)
      update(d => ({ ...d, paths: d.paths.map(p => p.id === pathId ? { ...p, read: [...p.read, lessonId] } : p), activities: [...d.activities, activity('lesson', module?.title || 'Lesson completed', seconds)] }))
    },
    completePractice(pathId, lessonId, score, seconds) {
      const path = data.paths.find(p => p.id === pathId)
      if (!path) return
      const module = path.modules.find(m => m.id === lessonId)
      update(d => ({ ...d, paths: d.paths.map(p => p.id === pathId ? { ...p, practiceScores: { ...p.practiceScores, [lessonId]: Math.max(score, p.practiceScores[lessonId] || 0) }, completed: score >= 50 ? [...new Set([...p.completed, lessonId])] : p.completed } : p), activities: [...d.activities, activity('practice', `Practice: ${module?.title || 'Lesson'}`, seconds)] }))
      notify(score >= 50 ? 'Nice work! Your progress has been saved.' : 'Practice saved. Review the explanations and try again—you’ve got this!')
    },
    updateProfile(profile) { update(d => ({ ...d, profile: { ...d.profile, ...profile } })); notify('Your preferences have been saved') },
    importData(imported) { if (!validData(imported)) throw new Error('This file is not a valid LearnPath backup.'); setData({ ...imported, updatedAt: new Date().toISOString() }); notify('Your learning progress has been restored') },
    async reset() { if (user) await cloud.remove(user.uid); setData(blankData()); sessionStorage.removeItem('learnpath-quiz'); notify('Your learning data has been reset') },
    async logout() { if (user) await cloud.save(user.uid, dataRef.current).catch(() => {}); await cloud.logout(); setData(blankData()); sessionStorage.removeItem('learnpath-quiz'); notify('You’re signed out. Your cloud progress is safe.') },
  }
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export const useStore = () => { const context = useContext(Context); if (!context) throw new Error('useStore must be used in StoreProvider'); return context }
export const progressOf = (path: LearningPath) => Math.round(path.completed.length / path.modules.length * 100)
export const todayMinutes = (activities: Activity[]) => Math.floor(activities.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).reduce((sum, a) => sum + a.seconds, 0) / 60)
export function streakOf(activities: Activity[]) {
  const dates = new Set(activities.map(a => new Date(a.date).toDateString()))
  const date = new Date(); let count = 0
  if (!dates.has(date.toDateString())) date.setDate(date.getDate() - 1)
  while (dates.has(date.toDateString())) { count++; date.setDate(date.getDate() - 1) }
  return count
}
