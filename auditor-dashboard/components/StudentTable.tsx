'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface Student {
  studentId: string
  name: string
  email: string
  department: string
  trustScore: number
  riskLevel: 'TRUSTED' | 'SUSPICIOUS' | 'HIGH_RISK'
  totalViolations: number
  updatedAt: string
}

interface Props {
  students: Student[]
  loading?: boolean
  onRefresh?: () => void
}

const RISK_CONFIG = {
  TRUSTED: { label: 'Trusted', color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
  SUSPICIOUS: { label: 'Suspicious', color: '#FACC15', bg: 'rgba(250,204,21,0.1)', border: 'rgba(250,204,21,0.2)' },
  HIGH_RISK: { label: 'High Risk', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' }
}

function TrustBar({ score }: { score: number }) {
  const color = score >= 90 ? '#22C55E' : score >= 70 ? '#FACC15' : '#EF4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)',
        borderRadius: '3px', overflow: 'hidden', minWidth: '80px'
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: '3px' }}
        />
      </div>
      <span style={{ fontSize: '13px', fontWeight: '700', color, minWidth: '32px' }}>
        {score}
      </span>
    </div>
  )
}

export default function StudentTable({ students, loading, onRefresh }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'TRUSTED' | 'SUSPICIOUS' | 'HIGH_RISK'>('ALL')
  const [sortBy, setSortBy] = useState<'trustScore' | 'totalViolations' | 'name'>('trustScore')

  const filtered = students
    .filter(s => {
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q)
      const matchesFilter = filter === 'ALL' || s.riskLevel === filter
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === 'trustScore') return a.trustScore - b.trustScore
      if (sortBy === 'totalViolations') return b.totalViolations - a.totalViolations
      return a.name.localeCompare(b.name)
    })

  const filterCounts = {
    ALL: students.length,
    TRUSTED: students.filter(s => s.riskLevel === 'TRUSTED').length,
    SUSPICIOUS: students.filter(s => s.riskLevel === 'SUSPICIOUS').length,
    HIGH_RISK: students.filter(s => s.riskLevel === 'HIGH_RISK').length,
  }

  return (
    <div style={{
      background: '#121826',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#F1F5F9', margin: 0 }}>
            Student Monitor
          </h2>
          <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
            {filtered.length} of {students.length} students
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'rgba(30,41,59,0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '8px 14px',
              color: '#E2E8F0',
              fontSize: '13px',
              outline: 'none',
              width: '200px'
            }}
          />

          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            style={{
              background: 'rgba(30,41,59,0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#E2E8F0',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="trustScore">Sort: Trust Score</option>
            <option value="totalViolations">Sort: Violations</option>
            <option value="name">Sort: Name</option>
          </select>

          {/* Refresh */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              style={{
                background: 'rgba(79,156,249,0.1)',
                border: '1px solid rgba(79,156,249,0.2)',
                borderRadius: '8px',
                padding: '8px 14px',
                color: '#4F9CF9',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              ↻ Refresh
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '0 24px'
      }}>
        {(['ALL', 'HIGH_RISK', 'SUSPICIOUS', 'TRUSTED'] as const).map(f => {
          const colors = { ALL: '#4F9CF9', HIGH_RISK: '#EF4444', SUSPICIOUS: '#FACC15', TRUSTED: '#22C55E' }
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${filter === f ? colors[f] : 'transparent'}`,
                color: filter === f ? colors[f] : '#64748B',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {f === 'ALL' ? 'All' : f === 'HIGH_RISK' ? 'High Risk' : f === 'SUSPICIOUS' ? 'Suspicious' : 'Trusted'}
              <span style={{
                marginLeft: '6px',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: filter === f ? `${colors[f]}20` : 'rgba(255,255,255,0.05)',
                color: filter === f ? colors[f] : '#64748B'
              }}>
                {filterCounts[f]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Student', 'Department', 'Trust Score', 'Violations', 'Risk Status', 'Action'].map(h => (
                <th key={h} style={{
                  padding: '12px 20px',
                  textAlign: 'left',
                  fontSize: '11px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#475569',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  whiteSpace: 'nowrap'
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} style={{ padding: '16px 20px' }}>
                      <div style={{
                        height: '14px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '4px',
                        width: j === 0 ? '140px' : j === 2 ? '120px' : '60px'
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#475569', fontSize: '14px' }}>
                  No students found
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {filtered.map((student, i) => {
                  const risk = RISK_CONFIG[student.riskLevel]
                  return (
                    <motion.tr
                      key={student.studentId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => router.push(`/students/${student.studentId}`)}
                    >
                      <td style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: `linear-gradient(135deg, ${risk.color}22, ${risk.color}11)`,
                            border: `1px solid ${risk.color}33`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: '700', color: risk.color,
                            flexShrink: 0
                          }}>
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#E2E8F0', fontSize: '14px' }}>
                              {student.name}
                            </div>
                            <div style={{ color: '#475569', fontSize: '12px', marginTop: '1px' }}>
                              {student.studentId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ color: '#94A3B8', fontSize: '13px' }}>{student.department}</span>
                      </td>
                      <td style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', minWidth: '160px' }}>
                        <TrustBar score={student.trustScore} />
                      </td>
                      <td style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '700',
                          background: student.totalViolations === 0 ? 'rgba(34,197,94,0.1)' : student.totalViolations > 10 ? 'rgba(239,68,68,0.1)' : 'rgba(250,204,21,0.1)',
                          color: student.totalViolations === 0 ? '#22C55E' : student.totalViolations > 10 ? '#EF4444' : '#FACC15'
                        }}>
                          {student.totalViolations}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background: risk.bg,
                          border: `1px solid ${risk.border}`,
                          color: risk.color
                        }}>
                          {risk.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/students/${student.studentId}`) }}
                          style={{
                            background: 'rgba(79,156,249,0.1)',
                            border: '1px solid rgba(79,156,249,0.2)',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            color: '#4F9CF9',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          View →
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
