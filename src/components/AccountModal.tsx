import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, Check, Cloud, Laptop, LoaderCircle, LogOut, Mail, Settings, ShieldCheck, User as UserIcon } from 'lucide-react'
import { cloud, firebaseConfigured } from '../lib/firebase'
import { useStore } from '../lib/store'
import { Brand, Modal } from './ui'

export function AccountModal({ onClose }: { onClose: () => void }) {
  const { data, user, updateProfile, notify, logout, sync } = useStore()
  const [name, setName] = useState(data.profile.name)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signUp, setSignUp] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const authenticate = async (google = false) => {
    setBusy(true)
    setError('')
    try {
      if (google) {
        await cloud.google()
      } else {
        await cloud.email(email, password, signUp ? name.trim() : undefined)
      }
      notify('Welcome! Signed in successfully.')
      onClose()
    } catch (e: any) {
      const message = e instanceof Error ? e.message : 'Sign-in failed.'
      setError(
        message.includes('invalid-credential')
          ? 'That email and password do not match. Please try again.'
          : message.includes('email-already-in-use')
          ? 'An account already exists with that email. Try signing in instead.'
          : message.includes('popup-closed')
          ? 'The Google sign-in window was closed. Please try again.'
          : message.includes('unauthorized-domain')
          ? 'This domain needs to be added to Firebase authorized domains.'
          : 'Could not sign in. Please verify your connection and try again.'
      )
    } finally {
      setBusy(false)
    }
  }

  const handleSignOut = async () => {
    setBusy(true)
    try {
      await logout()
      notify('You have been signed out.')
      onClose()
    } catch {
      notify('Error signing out.')
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!firebaseConfigured) {
      updateProfile({ name: name.trim() || 'Alex' })
      onClose()
    } else {
      void authenticate()
    }
  }

  const initials = (data.profile.name || user?.displayName || 'User')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const profilePhoto = user?.photoURL || data.profile.photoURL

  return (
    <Modal title="Your learner profile" onClose={onClose} className="account-modal">
      <Brand />

      {user ? (
        // SIGNED IN STATE: Display profile image, name, email, and details
        <div style={{ marginTop: '16px' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '16px 0',
            borderBottom: '1px solid var(--color-line, #e5e1d9)',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              overflow: 'hidden',
              background: 'var(--color-sand, #efe8dd)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--color-forest, #3d5245)',
              border: '2px solid var(--color-green, #2c6e52)',
              marginBottom: '12px'
            }}>
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={user.displayName || data.profile.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                initials
              )}
            </div>

            <h2 style={{ fontSize: '19px', fontWeight: 600, margin: '0 0 4px' }}>
              {user.displayName || data.profile.name}
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--color-stone, #99968c)', marginBottom: '8px' }}>
              {user.email}
            </span>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '12px',
              background: '#e0f2fe',
              color: '#0369a1',
              fontSize: '11px',
              fontWeight: 600
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6Z"/>
                <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z"/>
                <path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.4H3A10 10 0 0 0 2 12c0 1.6.4 3.2 1 4.6l3.4-2.7Z"/>
                <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.5 9.5 0 0 0 12 2a10 10 0 0 0-9 5.4l3.4 2.7A6 6 0 0 1 12 6Z"/>
              </svg>
              Google Account Connected
            </div>
          </div>

          <div style={{
            background: 'var(--color-ivory, #fffdf4)',
            border: '1px solid var(--color-line, #e5e1d9)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px',
            display: 'grid',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-stone, #99968c)' }}>Sync Status:</span>
              <strong style={{ color: 'var(--color-green, #2c6e52)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Cloud size={14} />{sync === 'syncing' ? 'Syncing...' : 'Connected'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-stone, #99968c)' }}>Daily Goal:</span>
              <strong>{data.profile.goal} minutes/day</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-stone, #99968c)' }}>Active Learning Paths:</span>
              <strong>{data.paths.length}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="button secondary full"
              onClick={() => {
                onClose()
                navigate('/settings')
              }}
            >
              <Settings size={15} />
              Manage Settings
            </button>
            <button
              className="button danger full"
              disabled={busy}
              onClick={handleSignOut}
            >
              {busy ? <LoaderCircle size={15} className="spin" /> : <LogOut size={15} />}
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        // SIGNED OUT STATE: Continue with Google or Email
        <>
          <div className="modal-heading">
            <span className="eyebrow">A SPACE THAT’S YOURS</span>
            <h2>Sign in to save your learning journey</h2>
            <p>
              Connect your Google account to sync your personalized learning paths, diagnostic results, and practice progress across devices.
            </p>
          </div>

          {firebaseConfigured && (
            <>
              <button
                className="button secondary full"
                disabled={busy}
                onClick={() => authenticate(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.6Z"/>
                  <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.7A10 10 0 0 0 12 22Z"/>
                  <path fill="#FBBC05" d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.4H3A10 10 0 0 0 2 12c0 1.6.4 3.2 1 4.6l3.4-2.7Z"/>
                  <path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.5 9.5 0 0 0 12 2a10 10 0 0 0-9 5.4l3.4 2.7A6 6 0 0 1 12 6Z"/>
                </svg>
                Continue with Google
              </button>
              <div className="form-divider">
                <span>or continue with email</span>
              </div>
            </>
          )}

          <form onSubmit={submit}>
            {(!firebaseConfigured || signUp) && (
              <label className="field-label">
                Your name
                <input
                  autoComplete="given-name"
                  required
                  maxLength={40}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="What should we call you?"
                />
              </label>
            )}

            {firebaseConfigured && (
              <>
                <label className="field-label">
                  Email address
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    required
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </label>
                <label className="field-label">
                  Password
                  <input
                    type="password"
                    autoComplete={signUp ? 'new-password' : 'current-password'}
                    value={password}
                    minLength={8}
                    required
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </label>
              </>
            )}

            {error && <div className="error-note" role="alert">{error}</div>}

            <button
              className="button primary full"
              disabled={busy || ((!firebaseConfigured || signUp) && !name.trim())}
            >
              {busy ? (
                <LoaderCircle size={17} className="spin" />
              ) : firebaseConfigured ? (
                <Mail size={16} />
              ) : (
                <Laptop size={16} />
              )}
              {firebaseConfigured
                ? signUp
                  ? 'Create my account'
                  : 'Sign in with email'
                : 'Save my learner profile'}
              <ArrowRight size={16} />
            </button>
          </form>

          {firebaseConfigured ? (
            <button
              className="text-button account-toggle"
              onClick={() => {
                setSignUp(!signUp)
                setError('')
              }}
            >
              {signUp ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </button>
          ) : (
            <div className="device-note">
              <ShieldCheck size={19} />
              <p>
                <strong>Your progress stays on this device.</strong> No account needed.
              </p>
            </div>
          )}

          <div className="account-footnote">
            <Cloud size={13} />
            Your learning. Your pace. Always.
          </div>
        </>
      )}
    </Modal>
  )
}
