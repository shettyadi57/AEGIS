'use client'

import { motion } from 'framer-motion'

interface StatCard {
  label: string
  value: number | string
  icon: string
  color: string
  glow: string
  change?: string
}

interface Props {
  stats: {
    totalStudents: number
    highRiskCount: number
    suspiciousCount: number
    totalViolations: number
  }
  loading?: boolean
}

export default function AnalyticsCards({ stats, loading }: Props) {
  const cards: StatCard[] = [
    {
      label: 'Total Students',
      value: stats?.totalStudents ?? 0,
      icon: '👥',
      color: '#4F9CF9',
      glow: 'rgba(79,156,249,0.2)',
      change: 'Active in exam'
    },
    {
      label: 'High Risk',
      value: stats?.highRiskCount ?? 0,
      icon: '🔴',
      color: '#EF4444',
      glow: 'rgba(239,68,68,0.2)',
      change: 'Score < 70'
    },
    {
      label: 'Suspicious',
      value: stats?.suspiciousCount ?? 0,
      icon: '⚠️',
      color: '#FACC15',
      glow: 'rgba(250,204,21,0.2)',
      change: 'Score 70–89'
    },
    {
      label: 'Total Violations',
      value: stats?.totalViolations ?? 0,
      icon: '⚡',
      color: '#F97316',
      glow: 'rgba(249,115,22,0.2)',
      change: 'All time'
    }
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px'
    }}>
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          style={{
            background: '#121826',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '22px',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default'
          }}
          whileHover={{
            y: -2,
            boxShadow: `0 8px 30px ${card.glow}`
          }}
        >
          {/* Background glow */}
          <div style={{
            position: 'absolute',
            top: '-30px',
            right: '-30px',
            width: '120px',
            height: '120px',
            background: `radial-gradient(circle, ${card.glow} 0%, transparent 70%)`,
            pointerEvents: 'none'
          }} />

          {/* Top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#64748B', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px' }}>
                {card.label}
              </p>
              {loading ? (
                <div style={{
                  width: '80px', height: '36px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  animation: 'pulse 1.5s ease infinite'
                }} />
              ) : (
                <p style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: '#F1F5F9',
                  margin: 0,
                  lineHeight: 1,
                  letterSpacing: '-1px'
                }}>
                  {card.value}
                </p>
              )}
            </div>
            <div style={{
              fontSize: '24px',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `rgba(${card.color === '#4F9CF9' ? '79,156,249' : card.color === '#EF4444' ? '239,68,68' : card.color === '#FACC15' ? '250,204,21' : '249,115,22'},0.1)`,
              borderRadius: '12px'
            }}>
              {card.icon}
            </div>
          </div>

          {/* Bottom */}
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: card.color
            }} />
            <span style={{ fontSize: '12px', color: '#64748B' }}>{card.change}</span>
          </div>

          {/* Bottom bar */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${card.color}, transparent)`
          }} />
        </motion.div>
      ))}
    </div>
  )
}
