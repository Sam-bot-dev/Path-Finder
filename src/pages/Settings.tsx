import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Cloud, Download, ImageUp, Laptop, LoaderCircle, LogIn, LogOut, RotateCcw, ShieldCheck, Sparkles, Trash2, Upload, User } from 'lucide-react'
import { useStore } from '../lib/store'
import { cloud, firebaseConfigured } from '../lib/firebase'
import { PageHeading } from '../components/ui'

export function Settings() {
  const { data, updateProfile, importData, reset, logout, user, notify, sync } = useStore()
  const [name, setName] = useState(data.profile.name)
  const [goal, setGoal] = useState(String(data.profile.goal))
  const [photo, setPhoto] = useState(data.profile.photoURL || '')
  const [busy, setBusy] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  // Keep local fields in sync with user state
  useEffect(() => {
    if (user) {
      if (user.displayName && user.displayName !== name) setName(user.displayName)
      if (user.photoURL && user.photoURL !== photo) setPhoto(user.photoURL)
    } else {
      setName(data.profile.name || 'Alex')
      setPhoto(data.profile.photoURL || '')
    }
  }, [user, data.profile])

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      if (user && firebaseConfigured) {
        const url = await cloud.photo(user.uid, file)
        setPhoto(url)
        updateProfile({ photoURL: url })
        notify('Your photo has been updated')
      } else {
        const reader = new FileReader()
        reader.onload = () => {
          setPhoto(reader.result as string)
          updateProfile({ photoURL: reader.result as string })
          notify('Your photo has been updated')
        }
        reader.readAsDataURL(file)
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not upload photo')
    } finally {
      setBusy(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setBusy(true)
    try {
      await cloud.google()
      notify('Signed in with Google successfully!')
    } catch (err: any) {
      notify(err.message || 'Google sign-in could not be completed.')
    } finally {
      setBusy(false)
    }
  }

  const handleSignOut = async () => {
    setBusy(true)
    try {
      await logout()
      notify('Signed out.')
    } catch {
      notify('Error signing out.')
    } finally {
      setBusy(false)
    }
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    updateProfile({
      name: name.trim() || 'Alex',
      goal: Math.max(5, Math.min(120, Number(goal) || 20)),
      photoURL: photo || undefined
    })
    notify('Your preferences have been saved')
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `learnpath-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        importData(JSON.parse(reader.result as string))
        notify('Your learning data has been restored')
      } catch {
        notify('This file is not a valid LearnPath backup')
      }
    }
    reader.readAsText(file)
  }

  const initials = (name || user?.displayName || 'User')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const currentPhoto = photo || user?.photoURL || data.profile.photoURL

  return (
    <>
      <div className="back-nav">
        <button className="back-button" onClick={() => window.history.back()}>
          <ArrowLeft size={16} />Back
        </button>
      </div>

      <PageHeading
        eyebrow="SETTINGS & PROFILE"
        title="Your learner profile"
        description="Manage your account, profile photo, and learning preferences."
      />

      {/* Connected Account Card */}
      <div style={{
        background: 'var(--color-card, #fff)',
        border: '1px solid var(--color-line, #e5e1d9)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'var(--color-sand, #efe8dd)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: 600,
            color: 'var(--color-forest, #3d5245)',
            border: '2px solid var(--color-green, #2c6e52)',
            flexShrink: 0
          }}>
            {currentPhoto ? (
              <img src={currentPhoto} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initials
            )}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '16px' }}>{user?.displayName || name}</strong>
              {user ? (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  background: '#e0f2fe',
                  color: '#0369a1',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6Z"/>
                    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z"/>
                    <path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.4H3A10 10 0 0 0 2 12c0 1.6.4 3.2 1 4.6l3.4-2.7Z"/>
                    <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.5 9.5 0 0 0 12 2a10 10 0 0 0-9 5.4l3.4 2.7A6 6 0 0 1 12 6Z"/>
                  </svg>
                  Google Account
                </span>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--color-stone, #99968c)' }}>
                  Local workspace
                </span>
              )}
            </div>

            <span style={{ fontSize: '13px', color: 'var(--color-stone, #99968c)', display: 'block', margin: '2px 0' }}>
              {user?.email || 'Sign in to sync your progress to Google Cloud'}
            </span>

            <span style={{ fontSize: '11px', color: 'var(--color-forest, #3d5245)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Cloud size={12} />
              {user ? `Connected · Sync status: ${sync}` : 'Offline local storage'}
            </span>
          </div>
        </div>

        <div>
          {user ? (
            <button
              type="button"
              className="button secondary small"
              disabled={busy}
              onClick={handleSignOut}
            >
              <LogOut size={14} />Sign out
            </button>
          ) : (
            <button
              type="button"
              className="button primary small"
              disabled={busy}
              onClick={handleGoogleSignIn}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6Z"/>
                <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z"/>
                <path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.4H3A10 10 0 0 0 2 12c0 1.6.4 3.2 1 4.6l3.4-2.7Z"/>
                <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.5 9.5 0 0 0 12 2a10 10 0 0 0-9 5.4l3.4 2.7A6 6 0 0 1 12 6Z"/>
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      <form onSubmit={save} className="settings">
        <div className="settings-group">
          <h3>Edit Profile Details</h3>
          <div className="settings-field">
            <label className="field-label">
              Display name
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={40}
                required
              />
            </label>
          </div>

          <div className="settings-field">
            <label className="field-label">
              Daily goal (minutes)
              <input
                type="number"
                min={5}
                max={120}
                value={goal}
                onChange={e => setGoal(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="settings-field">
            <label className="field-label">
              Profile photo
              <div className="photo-upload">
                <button
                  type="button"
                  className="button secondary small"
                  onClick={() => fileInput.current?.click()}
                >
                  <ImageUp size={16} />
                  {currentPhoto ? 'Change photo' : 'Upload photo'}
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onPhoto}
                  style={{ display: 'none' }}
                />
              </div>
            </label>
          </div>

          <button className="button primary small" disabled={busy}>
            {busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}
            Save preferences
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="settings-group">
          <h3>Your data & backup</h3>
          <p>Your learning data is stored locally and syncs to Google Firebase when signed in.</p>
          <div className="data-actions">
            <button type="button" className="button secondary small" onClick={exportData}>
              <Download size={16} />Export backup
            </button>
            <button type="button" className="button secondary small" onClick={() => fileInput.current?.click()}>
              <Upload size={16} />Restore backup
            </button>
            <input type="file" accept="application/json" onChange={onImport} style={{ display: 'none' }} />
          </div>
        </div>

        <div className="settings-group">
          <h3>Reset</h3>
          <p>
            Clear all learning data from this device. When signed in, this also removes your cloud learning record.
          </p>
          <button type="button" className="button danger small" onClick={() => setShowReset(true)}>
            <Trash2 size={16} />Reset learning data
          </button>
        </div>

        <div className="settings-group">
          <h3>About LearnPath AI</h3>
          <p>An adaptive, personalized learning space. No pressure, no grades—just a clear path forward.</p>
          <div className="settings-about">
            <span>Version 1.0</span>
            <span>·</span>
            <Link to="/topics" className="text-link">Explore topics<ArrowRight size={12} /></Link>
          </div>
        </div>
      </form>

      {showReset && (
        <div className="modal-overlay">
          <div role="dialog" aria-modal="true" aria-label="Reset learning data" className="modal">
            <h3>Reset learning data?</h3>
            <p>
              This will permanently erase all learning paths, practice scores, saved topics, and resources from this device. If you’re signed in, this also clears your cloud learning record. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="button secondary" onClick={() => setShowReset(false)}>
                Cancel
              </button>
              <button className="button danger" onClick={() => { void reset(); setShowReset(false) }}>
                <RotateCcw size={16} />Reset everything
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
