import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Cloud,
  Compass,
  Flame,
  Laptop,
  Menu,
  Route,
  Settings2,
  Sparkles,
  Sprout,
  X
} from 'lucide-react'
import { useStore, todayMinutes, streakOf } from '../lib/store'
import { Brand } from './ui'
import { AccountModal } from './AccountModal'
import { HelpModal } from './HelpModal'

const navigation = [
  { to: '/', label: 'Explore topics', icon: Compass },
  { to: '/paths', label: 'My learning paths', icon: Route },
  { to: '/progress', label: 'My progress', icon: ChartNoAxesCombined },
  { to: '/saved', label: 'Saved resources', icon: Bookmark }
]

export function Shell({ children }: { children: ReactNode }) {
  const { data, user, sync, toast } = useStore()
  const location = useLocation()
  const [mobile, setMobile] = useState(false)
  const [help, setHelp] = useState(false)
  const [account, setAccount] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [notificationRead, setNotificationRead] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  const today = todayMinutes(data.activities)
  const streak = streakOf(data.activities)
  const section =
    location.pathname === '/' || location.pathname === '/topics' || location.pathname.startsWith('/learn/')
      ? 'Explore'
      : location.pathname.startsWith('/progress')
      ? 'My progress'
      : location.pathname.startsWith('/saved')
      ? 'Saved resources'
      : location.pathname.startsWith('/settings')
      ? 'Settings'
      : location.pathname.startsWith('/diagnostic')
      ? 'Your check-in'
      : 'My learning paths'

  // Prioritize active logged-in user credentials over local fallback
  const displayName = user?.displayName || data.profile.name || 'Alex'
  const photoURL = user?.photoURL || data.profile.photoURL
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U'

  useEffect(() => {
    setMobile(false)
    setNotifications(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
    const heading = document.querySelector('main h1')
    if (heading) {
      heading.setAttribute('tabindex', '-1')
    }
  }, [location.pathname])

  useEffect(() => {
    if (!notifications) return
    const close = (event: MouseEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) setNotifications(false)
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotifications(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', key)
    }
  }, [notifications])

  useEffect(() => {
    if (!mobile) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobile(false)
    }
    document.addEventListener('keydown', key)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', key)
    }
  }, [mobile])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}

      <aside className={`sidebar ${mobile ? 'open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-brand">
          <Link to="/" aria-label="LearnPath AI home">
            <Brand />
          </Link>
          <button
            className="icon-button mobile-sidebar-close"
            onClick={() => setMobile(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-label">YOUR LEARNING SPACE</div>

        <nav className="primary-nav">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-item ${
                  isActive ||
                  (to === '/' &&
                    (location.pathname === '/topics' || location.pathname.startsWith('/learn/'))) ||
                  (to === '/paths' &&
                    (location.pathname.startsWith('/path/') ||
                      location.pathname.startsWith('/results/') ||
                      location.pathname.startsWith('/practice/')))
                    ? 'active'
                    : ''
                }`
              }
            >
              <Icon size={19} strokeWidth={1.65} />
              <span>{label}</span>
              {to === '/paths' && data.paths.length > 0 && (
                <small className="nav-count">{data.paths.length}</small>
              )}
              {to === '/saved' && data.savedTopics.length + data.savedResources.length > 0 && (
                <small className="nav-count">
                  {data.savedTopics.length + data.savedResources.length}
                </small>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-lower">
          <div className="daily-goal-card">
            <div className="goal-card-icon">
              <Sprout size={24} strokeWidth={1.6} />
              <span className="mini-spark">✧</span>
            </div>
            <h3>
              Small steps.
              <br />
              Big possibilities.
            </h3>
            <p>A little learning, every day.</p>
            <div className="goal-caption">
              <span>Your daily goal</span>
              <strong>
                {today}
                <span> / {data.profile.goal} min</span>
              </strong>
            </div>
            <div className="progress-track">
              <span style={{ width: `${Math.min(100, (today / data.profile.goal) * 100)}%` }} />
            </div>
            <Link to="/progress">
              Let’s keep growing
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <nav className="secondary-nav">
            <button className="nav-item" onClick={() => setHelp(true)}>
              <CircleHelp size={18} strokeWidth={1.65} />
              <span>Help & getting started</span>
            </button>
            <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Settings2 size={18} strokeWidth={1.65} />
              <span>Settings</span>
            </NavLink>
          </nav>

          <button
            className="sidebar-profile"
            onClick={() => setAccount(true)}
            aria-label="Open your learner profile"
          >
            <span className="avatar">
              {photoURL ? (
                <img src={photoURL} alt={displayName} referrerPolicy="no-referrer" />
              ) : (
                initials
              )}
            </span>
            <span className="profile-copy">
              <strong>{displayName}</strong>
              <span>{user?.email || (user ? 'Google Account' : 'Your personal workspace')}</span>
            </span>
            <ChevronDown size={15} />
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobile(true)}
              aria-label="Open navigation"
              aria-expanded={mobile}
            >
              <Menu size={21} />
            </button>
            <span className="workspace-label">My workspace</span>
            <ChevronRight size={13} className="breadcrumb-chevron" />
            <span className="topbar-current">{section}</span>
          </div>

          <div className="topbar-right">
            <span className="today-date">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </span>
            {streak > 0 && (
              <span className="streak-pill" title={`${streak}-day learning streak`}>
                <Flame size={15} />
                {streak}
              </span>
            )}
            <div className="notification-wrapper" ref={notificationRef}>
              <button
                className="icon-button notification-toggle"
                aria-label="Notifications"
                aria-expanded={notifications}
                onClick={() => {
                  setNotifications(!notifications)
                  setNotificationRead(true)
                }}
              >
                <Bell size={19} strokeWidth={1.65} />
                {!notificationRead && <i />}
              </button>
              {notifications && (
                <div className="notification-popover">
                  <div className="popover-heading">
                    <h3>Your little updates</h3>
                    <span>
                      All caught up <Check size={13} />
                    </span>
                  </div>
                  {data.activities.length ? (
                    [...data.activities]
                      .reverse()
                      .slice(0, 3)
                      .map(a => (
                        <div className="notification-item" key={a.id}>
                          <span className="notification-icon">
                            <Check size={16} />
                          </span>
                          <div>
                            <strong>{a.label}</strong>
                            <p>
                              Progress saved ·{' '}
                              {new Date(a.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="notification-item">
                      <span className="notification-icon">
                        <Sparkles size={17} />
                      </span>
                      <div>
                        <strong>A fresh start looks good on you.</strong>
                        <p>Your first discovery is waiting. Pick a topic and we’ll take it from there.</p>
                      </div>
                    </div>
                  )}
                  <Link
                    to="/progress"
                    className="popover-link"
                    onClick={() => setNotifications(false)}
                  >
                    See my progress
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              )}
            </div>

            <span className="topbar-divider" />

            <button
              className="topbar-profile"
              onClick={() => setAccount(true)}
              aria-label="Open your learner profile"
            >
              <span className="avatar small-avatar">
                {photoURL ? (
                  <img src={photoURL} alt={displayName} referrerPolicy="no-referrer" />
                ) : (
                  initials
                )}
              </span>
              <ChevronDown size={13} />
            </button>
          </div>
        </header>

        <main id="main-content" className="main-content">
          {children}
          <footer className="page-footer">
            <span>
              <Brand small /> A little wiser, every day.
            </span>
            <div>
              <span className={`sync-status ${sync === 'error' ? 'sync-error' : ''}`}>
                {user ? <Cloud size={12} /> : <Laptop size={12} />}
                {sync === 'syncing'
                  ? 'Syncing your progress…'
                  : sync === 'synced'
                  ? 'Progress synced'
                  : sync === 'error'
                  ? 'Saved on this device · Cloud offline'
                  : 'Progress saved on this device'}
              </span>
              <i>·</i>
              <button onClick={() => setHelp(true)}>Made for curious minds</button>
            </div>
          </footer>
        </main>
      </div>

      {help && <HelpModal onClose={() => setHelp(false)} />}
      {account && <AccountModal onClose={() => setAccount(false)} />}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={15} />
          </span>
          {toast}
        </div>
      )}
    </div>
  )
}
