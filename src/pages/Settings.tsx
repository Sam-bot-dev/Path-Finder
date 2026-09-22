import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Cloud, Download, ImageUp, Laptop, LoaderCircle, RotateCcw, ShieldCheck, Sparkles, Trash2, Upload } from 'lucide-react'
import { useStore } from '../lib/store'
import { cloud, firebaseConfigured } from '../lib/firebase'
import { PageHeading } from '../components/ui'

export function Settings() {
  const { data, updateProfile, importData, reset, logout, user, notify } = useStore()
  const [name, setName] = useState(data.profile.name)
  const [goal, setGoal] = useState(String(data.profile.goal))
  const [photo, setPhoto] = useState(data.profile.photoURL || '')
  const [busy, setBusy] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try {
      if (user && firebaseConfigured) { const url = await cloud.photo(user.uid, file); setPhoto(url); updateProfile({ photoURL: url }); notify('Your photo has been updated') }
      else { const reader = new FileReader(); reader.onload = () => { setPhoto(reader.result as string); updateProfile({ photoURL: reader.result as string }); notify('Your photo has been updated') }; reader.readAsDataURL(file) }
    } catch (e) { notify(e instanceof Error ? e.message : 'Could not upload photo') }
    finally { setBusy(false) }
  }
  const save = (e: FormEvent) => { e.preventDefault(); updateProfile({ name: name.trim() || 'Alex', goal: Math.max(5, Math.min(120, Number(goal) || 20)), photoURL: photo || undefined }); notify('Your preferences have been saved') }
  const exportData = () => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `learnpath-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url) }
  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { importData(JSON.parse(reader.result as string)); notify('Your learning data has been restored') } catch { notify('This file is not a valid LearnPath backup') } }; reader.readAsText(file) }
  return <>
    <div className="back-nav"><button className="back-button" onClick={() => window.history.back()}><ArrowLeft size={16} />Back</button></div>
    <PageHeading eyebrow="SETTINGS" title="Your preferences" description="Make this space feel like yours. Your data stays on this device unless you choose to connect an account." />
    <form onSubmit={save} className="settings">
      <div className="settings-group"><h3>Your learner profile</h3><div className="settings-field"><label className="field-label">Your name<input value={name} onChange={e => setName(e.target.value)} maxLength={40} required /></label></div><div className="settings-field"><label className="field-label">Daily goal (minutes)<input type="number" min={5} max={120} value={goal} onChange={e => setGoal(e.target.value)} required /></label></div><div className="settings-field"><label className="field-label">Profile photo<div className="photo-upload"><button type="button" className="button secondary small" onClick={() => fileInput.current?.click()}><ImageUp size={16} />{photo ? 'Change photo' : 'Upload photo'}</button><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} style={{ display: 'none' }} /></div></label></div><button className="button primary small" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}Save preferences<ArrowRight size={16} /></button></div>
      <div className="settings-group"><h3>Your data</h3><p>Your learning data stays on this device. Export a backup to keep it safe, or restore from a previous backup.</p><div className="data-actions"><button type="button" className="button secondary small" onClick={exportData}><Download size={16} />Export backup</button><button type="button" className="button secondary small" onClick={() => fileInput.current?.click()}><Upload size={16} />Restore backup</button><input type="file" accept="application/json" onChange={onImport} style={{ display: 'none' }} /></div></div>
      <div className="settings-group"><h3>Reset</h3><p>Clear all learning data from this device. When signed in, this also removes your cloud learning record. This does not delete your Firebase authentication account.</p><button type="button" className="button danger small" onClick={() => setShowReset(true)}><Trash2 size={16} />Reset learning data</button></div>
      <div className="settings-group"><h3>About LearnPath AI</h3><p>A quiet, focused workspace built for curious learners. No pressure, no grades—just a clear path forward.</p><div className="settings-about"><span>Version 1.0</span><span>·</span><Link to="/topics" className="text-link">Explore topics<ArrowRight size={12} /></Link></div></div>
    </form>
    {showReset && <div className="modal-overlay"><div role="dialog" aria-modal="true" aria-label="Reset learning data" className="modal"><h3>Reset learning data?</h3><p>This will permanently erase all learning paths, practice scores, saved topics, and resources from this device. If you’re signed in, this also clears your cloud learning record. This action cannot be undone.</p><div className="modal-actions"><button className="button secondary" onClick={() => setShowReset(false)}>Cancel</button><button className="button danger" onClick={() => { void reset(); setShowReset(false) }}><RotateCcw size={16} />Reset everything</button></div></div></div>}
  </>
}
