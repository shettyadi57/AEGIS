'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import Navbar from '../../components/Navbar'
import AnalyticsCards from '../../components/AnalyticsCards'
import StudentTable from '../../components/StudentTable'
import HeatmapChart from '../../components/HeatmapChart'
import { getStudents, getStats } from '../../services/api'

interface LiveAlert {
  id: string
  studentId: string
  studentName: string
  violation: string
  trustScore: number
  timestamp: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [students, setStudents] = useState([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([])
  const [socketConnected, setSocketConnected] = useState(false)

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('aegis_token')
    if (!token) router.push('/login')
  }, [router])

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, statsRes] = await Promise.all([
        getStudents(),
        getStats()
      ])
      setStudents(studentsRes.students || [])
      setStats(statsRes)
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Socket.io real-time
  useEffect(() => {
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      setSocketConnected(true)
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
    })

    // Live violation alert
    socket.on('alert:high_risk', (data: any) => {
      const alert: LiveAlert = {
        id: `${Date.now()}-${Math.random()}`,
        studentId: data.studentId,
        studentName: data.studentName,
        violation: data.violation,
        trustScore: data.trustScore,
        timestamp: data.timestamp
      }
      setLiveAlerts(prev => [alert, ...prev].slice(0, 5))

      // Auto-dismiss
      setTimeout(() => {
        setLiveAlerts(prev => prev.filter(a => a.id !== alert.id))
      }, 8000)
    })

    // Live student update — refresh table row
    socket.on('student:update', () => {
      fetchData()
    })

    return () => { socket.disconnect() }
  }, [fetchData])

  const handleRefresh = () => {
    setLoading(true)
    fetchData()
  }

  return (
    <div style={{ background: '#0B0F19', minHeight: '100vh' }}>
      <Navbar activePage="dashboard" />

      {/* Live Alerts */}
      <div style={{
        position: 'fixed', top: '72px', right: '20px',
        zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px',
        maxWidth: '320px', width: '100%'
      }}>
        <AnimatePresence>
          {liveAlerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{
                background: 'linear-gradient(135deg, #1a0a0a, #2d0f0f)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                boxShadow: '0 8px 32px rgba(239,68,68,0.2)'
              }}
              onClick={() => router.push(`/students/${alert.studentId}`)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: '#EF4444',
                  boxShadow: '0 0 8px rgba(239,68,68,0.8)',
                  animation: 'pulse 1s infinite'
                }} />
                <span style={{ fontSize: '10px', color: '#EF4444', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  High Risk Alert
                </span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#E2E8F0' }}>
                {alert.studentName}
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                {alert.violation.replace(/_/g, ' ')} · Trust: {alert.trustScore}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#F1F5F9', margin: 0, letterSpacing: '-0.5px' }}>
              Exam Monitor
            </h1>
            <p style={{ color: '#475569', fontSize: '13px', margin: '4px 0 0' }}>
              Real-time integrity monitoring dashboard
              {socketConnected && (
                <span style={{ marginLeft: '10px', color: '#22C55E', fontSize: '11px', fontWeight: '600' }}>
                  ● Live
                </span>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleRefresh}
              style={{
                background: 'rgba(79,156,249,0.1)',
                border: '1px solid rgba(79,156,249,0.2)',
                borderRadius: '10px',
                padding: '8px 16px',
                color: '#4F9CF9',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ↻ Refresh
            </button>
          </div>
        </motion.div>

        {/* Analytics Cards */}
        <div style={{ marginBottom: '24px' }}>
          <AnalyticsCards stats={stats?.stats} loading={loading} />
        </div>

        {/* Heatmap */}
        <div style={{ marginBottom: '24px' }}>
          <HeatmapChart
            data={stats?.heatmap || []}
            violationDistribution={stats?.violationDistribution || []}
          />
        </div>

        {/* Student Table */}
        <div style={{ marginBottom: '24px' }}>
          <StudentTable
            students={students}
            loading={loading}
            onRefresh={handleRefresh}
          />
        </div>

        {/* Recent Violations Feed */}
        {stats?.recentViolations?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#121826',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '20px'
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F1F5F9', margin: '0 0 16px' }}>
              Recent Violation Feed
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {stats.recentViolations.slice(0, 8).map((v: any, i: number) => (
                <motion.div
                  key={v._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.04)',
                    transition: 'background 0.15s'
                  }}
                  onClick={() => router.push(`/students/${v.studentId}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      fontSize: '11px', fontWeight: '700', padding: '2px 8px',
                      borderRadius: '6px', background: 'rgba(79,156,249,0.1)',
                      color: '#4F9CF9', fontFamily: 'monospace'
                    }}>
                      {v.studentId}
                    </div>
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>
                      {v.violation.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '700', color: '#EF4444',
                      padding: '2px 8px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)'
                    }}>
                      -{v.penalty} pts
                    </span>
                    <span style={{ fontSize: '11px', color: '#475569' }}>
                      {new Date(v.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
