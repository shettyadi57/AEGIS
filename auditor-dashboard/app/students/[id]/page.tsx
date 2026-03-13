'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Navbar from '../../../components/Navbar'
import TrustScoreGauge from '../../../components/TrustScoreGauge'
import ViolationTimeline from '../../../components/ViolationTimeline'
import { getStudent, getViolations, resetStudentScore } from '../../../services/api'

const VIOLATION_META: Record<string, { label: string; color: string }> = {
  TAB_SWITCH:             { label: 'Tab Switch',           color: '#FACC15' },
  COPY_ATTEMPT:           { label: 'Copy Attempt',         color: '#F97316' },
  PASTE_ATTEMPT:          { label: 'Paste Attempt',        color: '#F97316' },
  DEVTOOLS_OPEN:          { label: 'DevTools',             color: '#EF4444' },
  MULTIPLE_FACES:         { label: 'Multiple Faces',       color: '#EF4444' },
  NO_FACE:                { label: 'No Face',              color: '#F97316' },
  BACKGROUND_CONVERSATION:{ label: 'Conversation',         color: '#EF4444' },
  FULLSCREEN_EXIT:        { label: 'Fullscreen Exit',      color: '#FACC15' },
  IDLE_DETECTED:          { label: 'Idle',                 color: '#64748B' },
  PRINT_SCREEN:           { label: 'Screenshot',           color: '#EF4444' },
  WINDOW_BLUR:            { label: 'Window Blur',          color: '#FACC15' },
}

export default function StudentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params?.id as string

  const [student, setStudent] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [violations, setViolations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [resetLoading, setResetLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'timeline' | 'summary'>('timeline')

  useEffect(() => {
    const token = localStorage.getItem('aegis_token')
    if (!token) { router.push('/login'); return }
    fetchData()
  }, [studentId])

  async function fetchData() {
    setLoading(true)
    try {
      const [studentRes, violationsRes] = await Promise.all([
        getStudent(studentId),
        getViolations(studentId)
      ])
      setStudent(studentRes.student)
      setAnalytics(studentRes.analytics)
      setViolations(violationsRes.violations || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!confirm(`Reset trust score for ${student?.name}? This will clear all violations.`)) return
    setResetLoading(true)
    try {
      await resetStudentScore(studentId)
      await fetchData()
    } finally {
      setResetLoading(false)
    }
  }

  function exportPDF() {
    if (!student) return

    // Dynamic import for PDF generation
    import('jspdf').then(({ jsPDF }) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF()
        const riskColor: [number,number,number] = student.riskLevel === 'HIGH_RISK' ? [239,68,68] : student.riskLevel === 'SUSPICIOUS' ? [250,204,21] : [34,197,94]

        // Header
        doc.setFillColor(11, 15, 25)
        doc.rect(0, 0, 210, 297, 'F')
        doc.setFillColor(18, 24, 38)
        doc.rect(0, 0, 210, 40, 'F')

        doc.setTextColor(79, 156, 249)
        doc.setFontSize(22)
        doc.setFont('helvetica', 'bold')
        doc.text('AEGIS', 14, 18)

        doc.setTextColor(180, 190, 210)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.text('Advanced Exam Guardrail Integrity System', 14, 26)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 33)

        // Title
        doc.setTextColor(241, 245, 249)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('Credibility Report', 130, 20)

        // Student info box
        doc.setFillColor(30, 41, 59)
        doc.roundedRect(14, 48, 182, 55, 4, 4, 'F')

        doc.setTextColor(100, 116, 139)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text('STUDENT', 20, 58)
        doc.text('STUDENT ID', 80, 58)
        doc.text('DEPARTMENT', 140, 58)

        doc.setTextColor(241, 245, 249)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text(student.name, 20, 67)
        doc.text(student.studentId, 80, 67)

        doc.setFontSize(11)
        doc.text(student.department || 'N/A', 140, 67)

        // Trust Score row
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text('TRUST SCORE', 20, 82)
        doc.text('RISK LEVEL', 80, 82)
        doc.text('TOTAL VIOLATIONS', 140, 82)

        doc.setTextColor(...riskColor)
        doc.setFontSize(20)
        doc.setFont('helvetica', 'bold')
        doc.text(String(student.trustScore), 20, 93)

        doc.setFontSize(12)
        doc.text(student.riskLevel.replace('_', ' '), 80, 93)

        doc.setTextColor(241, 245, 249)
        doc.text(String(student.totalViolations), 140, 93)

        // Violations table
        if (violations.length > 0) {
          doc.setTextColor(241, 245, 249)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text('Violation Log', 14, 116)

          const tableData = violations.slice(0, 30).map(v => [
            new Date(v.timestamp).toLocaleTimeString(),
            v.violation.replace(/_/g, ' '),
            `-${v.penalty} pts`,
            v.duration ? `${v.duration}s` : '—'
          ])

          ;(doc as any).autoTable({
            startY: 120,
            head: [['Time', 'Violation', 'Penalty', 'Duration']],
            body: tableData,
            styles: {
              fillColor: [30, 41, 59],
              textColor: [180, 190, 210],
              fontSize: 9,
              cellPadding: 5
            },
            headStyles: {
              fillColor: [79, 156, 249],
              textColor: [255, 255, 255],
              fontStyle: 'bold'
            },
            alternateRowStyles: { fillColor: [18, 24, 38] }
          })
        }

        // Footer
        const pageH = doc.internal.pageSize.height
        doc.setFillColor(18, 24, 38)
        doc.rect(0, pageH - 16, 210, 16, 'F')
        doc.setTextColor(71, 85, 105)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.text('AEGIS — Advanced Exam Guardrail Integrity System — Confidential', 14, pageH - 6)

        doc.save(`AEGIS-Report-${student.studentId}-${Date.now()}.pdf`)
      })
    })
  }

  const risk = student?.riskLevel === 'HIGH_RISK'
    ? { color: '#EF4444', bg: 'rgba(239,68,68,0.1)', label: 'High Risk' }
    : student?.riskLevel === 'SUSPICIOUS'
    ? { color: '#FACC15', bg: 'rgba(250,204,21,0.1)', label: 'Suspicious' }
    : { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', label: 'Trusted' }

  if (loading) {
    return (
      <div style={{ background: '#0B0F19', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(79,156,249,0.2)', borderTopColor: '#4F9CF9', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#475569', fontSize: '14px' }}>Loading student data...</p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!student) {
    return (
      <div style={{ background: '#0B0F19', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <p style={{ color: '#475569', fontSize: '16px' }}>Student not found</p>
            <button onClick={() => router.push('/dashboard')} style={{ marginTop: '16px', color: '#4F9CF9', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const violationTypes = Object.entries(analytics?.violationsByType || {})
    .sort(([, a], [, b]) => (b as number) - (a as number))

  return (
    <div style={{ background: '#0B0F19', minHeight: '100vh' }}>
      <Navbar />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '13px', padding: 0 }}
          >
            Dashboard
          </button>
          <span style={{ color: '#374151' }}>/</span>
          <span style={{ color: '#94A3B8', fontSize: '13px' }}>Students</span>
          <span style={{ color: '#374151' }}>/</span>
          <span style={{ color: '#4F9CF9', fontSize: '13px', fontWeight: '600' }}>{student.studentId}</span>
        </div>

        {/* Student Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #121826, #0f1620)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px',
            padding: '28px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
            flexWrap: 'wrap'
          }}
        >
          {/* Avatar */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: `linear-gradient(135deg, ${risk.color}22, ${risk.color}11)`,
            border: `2px solid ${risk.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: '800', color: risk.color, flexShrink: 0
          }}>
            {student.name.charAt(0)}
          </div>

          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#F1F5F9', margin: 0, letterSpacing: '-0.3px' }}>
                {student.name}
              </h1>
              <span style={{
                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                color: risk.color, background: `${risk.color}15`,
                border: `1px solid ${risk.color}33`
              }}>
                {risk.label}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { label: 'Student ID', value: student.studentId },
                { label: 'Email', value: student.email },
                { label: 'Department', value: student.department }
              ].map(item => (
                <div key={item.label}>
                  <span style={{ fontSize: '11px', color: '#475569', display: 'block' }}>{item.label}</span>
                  <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '500' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust gauge */}
          <TrustScoreGauge score={student.trustScore} size={160} />

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={exportPDF}
              style={{
                background: 'linear-gradient(135deg, #4F9CF9, #2563EB)',
                color: 'white', border: 'none', borderRadius: '10px',
                padding: '10px 18px', fontSize: '13px', fontWeight: '600',
                cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              📄 Export PDF
            </button>
            <button
              onClick={handleReset}
              disabled={resetLoading}
              style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '10px', padding: '10px 18px',
                color: '#EF4444', fontSize: '13px', fontWeight: '600',
                cursor: resetLoading ? 'not-allowed' : 'pointer',
                opacity: resetLoading ? 0.5 : 1, whiteSpace: 'nowrap'
              }}
            >
              {resetLoading ? 'Resetting...' : '↺ Reset Score'}
            </button>
          </div>
        </motion.div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Trust Score', value: student.trustScore, unit: '/100', color: risk.color },
            { label: 'Violations', value: student.totalViolations, unit: 'events', color: '#F97316' },
            { label: 'Total Penalty', value: analytics?.totalPenalty || 0, unit: 'pts', color: '#EF4444' },
            { label: 'Critical', value: analytics?.severityBreakdown?.critical || 0, unit: 'events', color: '#EF4444' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                background: '#121826',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '26px', fontWeight: '800', color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>{stat.unit}</div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', fontWeight: '500' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'start' }}>
          {/* Timeline card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              background: '#121826',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          >
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px' }}>
              {(['timeline', 'summary'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '16px 16px',
                    background: 'none', border: 'none',
                    borderBottom: `2px solid ${activeTab === tab ? '#4F9CF9' : 'transparent'}`,
                    color: activeTab === tab ? '#4F9CF9' : '#64748B',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    textTransform: 'capitalize', transition: 'all 0.2s'
                  }}
                >
                  {tab === 'timeline' ? '⏱ Violation Timeline' : '📊 Summary'}
                </button>
              ))}
            </div>

            {activeTab === 'timeline' ? (
              <ViolationTimeline violations={violations} />
            ) : (
              <div style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F1F5F9', margin: '0 0 16px' }}>
                  Violation Breakdown
                </h3>
                {violationTypes.length === 0 ? (
                  <p style={{ color: '#475569', fontSize: '13px' }}>No violations on record</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {violationTypes.map(([type, count]) => {
                      const meta = VIOLATION_META[type] || { label: type, color: '#64748B' }
                      const max = (violationTypes[0][1] as number)
                      const pct = ((count as number) / max) * 100
                      return (
                        <div key={type}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>{meta.label}</span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: meta.color }}>{count as number}×</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6 }}
                              style={{ height: '100%', background: meta.color, borderRadius: '3px' }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Severity breakdown */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                background: '#121826',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '20px'
              }}
            >
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#F1F5F9', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Severity Breakdown
              </h3>
              {[
                { label: 'Critical (≥15 pts)', count: analytics?.severityBreakdown?.critical || 0, color: '#EF4444' },
                { label: 'High (8-14 pts)', count: analytics?.severityBreakdown?.high || 0, color: '#F97316' },
                { label: 'Medium (5-7 pts)', count: analytics?.severityBreakdown?.medium || 0, color: '#FACC15' },
                { label: 'Low (<5 pts)', count: analytics?.severityBreakdown?.low || 0, color: '#22C55E' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: '#64748B' }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: item.count > 0 ? item.color : '#374151' }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Quick verdict */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                background: `linear-gradient(135deg, ${risk.color}12, ${risk.color}06)`,
                border: `1px solid ${risk.color}25`,
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                {student.riskLevel === 'TRUSTED' ? '✅' : student.riskLevel === 'SUSPICIOUS' ? '⚠️' : '🚨'}
              </div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: risk.color, marginBottom: '4px' }}>
                {risk.label}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.5 }}>
                {student.riskLevel === 'TRUSTED'
                  ? 'Student is maintaining exam integrity'
                  : student.riskLevel === 'SUSPICIOUS'
                  ? 'Suspicious activity detected. Monitor closely.'
                  : 'High risk student. Immediate review recommended.'
                }
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
