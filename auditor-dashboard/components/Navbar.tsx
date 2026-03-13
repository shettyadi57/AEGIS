'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  activePage?: string
}

export default function Navbar({ activePage = 'dashboard' }: Props) {
  const router = useRouter()
  const [admin, setAdmin] = useState<any>(null)
  const [liveCount, setLiveCount] = useState(0)
  const [alertCount, setAlertCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('aegis_admin')
    if (stored) setAdmin(JSON.parse(stored))
  }, [])

  function logout() {
    localStorage.removeItem('aegis_token')
    localStorage.removeItem('aegis_admin')
    router.push('/login')
  }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(11, 15, 25, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      height: '60px',
      gap: '20px'
    }}>
      {/* Logo */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        onClick={() => router.push('/dashboard')}
      >
        <div style={{
          width: '32px', height: '32px',
          background: 'linear-gradient(135deg, #4F9CF9, #2563EB)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px',
          boxShadow: '0 0 16px rgba(79,156,249,0.3)'
        }}>
          ⚡
        </div>
        <div>
          <span style={{ fontWeight: '800', fontSize: '15px', color: '#F1F5F9', letterSpacing: '-0.3px' }}>AEGIS</span>
          <span style={{ fontSize: '10px', color: '#475569', display: 'block', lineHeight: 1, marginTop: '1px' }}>INTEGRITY SYSTEM</span>
        </div>
      </div>

      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#22C55E',
          boxShadow: '0 0 8px rgba(34,197,94,0.6)',
          animation: 'pulse 2s infinite'
        }} />
        <span style={{ fontSize: '11px', color: '#22C55E', fontWeight: '600' }}>LIVE</span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
        {[
          { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
        ].map(nav => (
          <button
            key={nav.id}
            onClick={() => router.push(nav.path)}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activePage === nav.id ? 'rgba(79,156,249,0.15)' : 'transparent',
              color: activePage === nav.id ? '#4F9CF9' : '#64748B',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {nav.label}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Time */}
      <LiveClock />

      {/* Admin */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '6px 12px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #4F9CF9, #2563EB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: '700', color: 'white'
          }}>
            {admin?.name?.charAt(0) || 'A'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#E2E8F0', lineHeight: 1 }}>
              {admin?.name?.split(' ')[0] || 'Admin'}
            </div>
            <div style={{ fontSize: '10px', color: '#475569', marginTop: '1px' }}>
              {admin?.role || 'AUDITOR'}
            </div>
          </div>
          <span style={{ color: '#475569', fontSize: '10px' }}>▾</span>
        </button>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              style={{
                position: 'absolute', top: '48px', right: 0,
                background: '#1E293B',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '8px',
                minWidth: '180px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                zIndex: 200
              }}
            >
              <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>{admin?.name}</div>
                <div style={{ fontSize: '11px', color: '#475569' }}>{admin?.email}</div>
              </div>
              <button
                onClick={logout}
                style={{
                  width: '100%', padding: '8px 12px', background: 'none',
                  border: 'none', borderRadius: '8px', color: '#EF4444',
                  fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                  textAlign: 'left', transition: 'background 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                🚪 Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}

function LiveClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('en-IN', { hour12: false }))
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{
      fontSize: '13px', fontWeight: '600', color: '#94A3B8',
      fontVariantNumeric: 'tabular-nums',
      fontFamily: 'monospace'
    }}>
      {time}
    </div>
  )
}
