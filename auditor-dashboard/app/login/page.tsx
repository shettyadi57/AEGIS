'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@aegis.local')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Redirect if already logged in
    const token = localStorage.getItem('aegis_token')
    if (token) router.push('/dashboard')
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      localStorage.setItem('aegis_token', data.token)
      localStorage.setItem('aegis_admin', JSON.stringify(data.admin))
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0B0F19',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background effects */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(79,156,249,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(79,156,249,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(79,156,249,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '420px', padding: '0 20px', position: 'relative' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #4F9CF9, #2563EB)',
              borderRadius: '18px',
              fontSize: '28px',
              marginBottom: '20px',
              boxShadow: '0 0 40px rgba(79,156,249,0.4), 0 8px 32px rgba(0,0,0,0.4)'
            }}
          >
            ⚡
          </motion.div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #F1F5F9, #94A3B8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: 0,
            letterSpacing: '-0.5px'
          }}>
            AEGIS
          </h1>
          <p style={{ color: '#64748B', fontSize: '13px', marginTop: '6px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            Auditor Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(18, 24, 38, 0.9)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '20px',
          padding: '36px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#F1F5F9', margin: '0 0 8px' }}>
            Sign in to continue
          </h2>
          <p style={{ color: '#64748B', fontSize: '13px', margin: '0 0 28px' }}>
            Access the exam integrity monitoring system
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: '#EF4444',
                fontSize: '13px'
              }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@aegis.local"
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#E2E8F0',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#4F9CF9'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94A3B8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  color: '#E2E8F0',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = '#4F9CF9'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(79,156,249,0.5)' : 'linear-gradient(135deg, #4F9CF9, #2563EB)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(79,156,249,0.3)',
                transition: 'all 0.2s',
                letterSpacing: '0.3px'
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In →'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{
            marginTop: '24px',
            padding: '14px',
            background: 'rgba(79,156,249,0.05)',
            border: '1px solid rgba(79,156,249,0.1)',
            borderRadius: '10px'
          }}>
            <p style={{ fontSize: '11px', color: '#4F9CF9', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 8px' }}>
              Demo Credentials
            </p>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '0 0 4px' }}>
              admin@aegis.local / admin123
            </p>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
              proctor@aegis.local / proctor123
            </p>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#374151', fontSize: '12px', marginTop: '24px' }}>
          AEGIS v1.0 — Advanced Exam Guardrail Integrity System
        </p>
      </motion.div>
    </div>
  )
}
