'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'

interface Violation {
  _id: string
  violation: string
  penalty: number
  timestamp: string
  duration?: number
  meta?: Record<string, any>
}

interface Props {
  violations: Violation[]
  loading?: boolean
}

const VIOLATION_META: Record<string, { icon: string; label: string; color: string }> = {
  TAB_SWITCH:            { icon: '🔄', label: 'Tab Switch',             color: '#FACC15' },
  TAB_HIDDEN:            { icon: '👁️', label: 'Tab Hidden',             color: '#FACC15' },
  COPY_ATTEMPT:          { icon: '📋', label: 'Copy Attempt',           color: '#F97316' },
  PASTE_ATTEMPT:         { icon: '📌', label: 'Paste Attempt',          color: '#F97316' },
  CUT_ATTEMPT:           { icon: '✂️', label: 'Cut Attempt',            color: '#F97316' },
  SELECT_ALL:            { icon: '🔲', label: 'Select All',             color: '#FACC15' },
  DEVTOOLS_OPEN:         { icon: '🔧', label: 'DevTools Opened',        color: '#EF4444' },
  RIGHT_CLICK:           { icon: '🖱️', label: 'Right Click',           color: '#94A3B8' },
  FULLSCREEN_EXIT:       { icon: '⛶',  label: 'Fullscreen Exit',        color: '#FACC15' },
  KEYBOARD_SHORTCUT:     { icon: '⌨️', label: 'Blocked Shortcut',      color: '#F97316' },
  IDLE_DETECTED:         { icon: '💤', label: 'Idle Detected',          color: '#64748B' },
  PRINT_SCREEN:          { icon: '📸', label: 'Screenshot Attempt',     color: '#EF4444' },
  PRINT_ATTEMPT:         { icon: '🖨️', label: 'Print Attempt',         color: '#EF4444' },
  VIEW_SOURCE:           { icon: '🔍', label: 'View Source',            color: '#EF4444' },
  WINDOW_BLUR:           { icon: '🪟', label: 'Window Focus Lost',      color: '#FACC15' },
  WINDOW_RESIZE:         { icon: '↔️', label: 'Window Resized',        color: '#FACC15' },
  NAVIGATION_CHANGE:     { icon: '🔀', label: 'Navigation Detected',    color: '#EF4444' },
  PAGE_UNLOAD:           { icon: '🚪', label: 'Page Unload',            color: '#EF4444' },
  MULTIPLE_FACES:        { icon: '👥', label: 'Multiple Faces',         color: '#EF4444' },
  NO_FACE:               { icon: '👤', label: 'Face Not Detected',      color: '#F97316' },
  CAMERA_DISABLED:       { icon: '📵', label: 'Camera Disabled',        color: '#EF4444' },
  CAMERA_OBSTRUCTED:     { icon: '🙈', label: 'Camera Obstructed',     color: '#F97316' },
  VOICE_DETECTED:        { icon: '🎙️', label: 'Voice Activity',        color: '#FACC15' },
  BACKGROUND_CONVERSATION:{ icon: '💬', label: 'Background Conversation',color: '#EF4444' },
  MICROPHONE_DISABLED:   { icon: '🔇', label: 'Mic Disabled',           color: '#EF4444' },
  MICROPHONE_MUTED:      { icon: '🔕', label: 'Mic Muted',             color: '#F97316' },
  SAVE_ATTEMPT:          { icon: '💾', label: 'Save Attempt',           color: '#FACC15' },
}

export default function ViolationTimeline({ violations, loading }: Props) {
  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '6px', width: '60%' }} />
              <div style={{ height: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!violations || violations.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
        <p style={{ color: '#22C55E', fontWeight: '600', fontSize: '15px', margin: 0 }}>No violations recorded</p>
        <p style={{ color: '#475569', fontSize: '13px', marginTop: '6px' }}>This student has a clean record</p>
      </div>
    )
  }

  const sorted = [...violations].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div style={{ padding: '8px 24px 24px' }}>
      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute',
          left: '15px',
          top: '8px',
          bottom: '8px',
          width: '1px',
          background: 'linear-gradient(to bottom, rgba(79,156,249,0.3), rgba(79,156,249,0.05))'
        }} />

        {sorted.map((v, i) => {
          const meta = VIOLATION_META[v.violation] || { icon: '⚠️', label: v.violation, color: '#64748B' }
          const isHighSeverity = (v.penalty || 0) >= 15
          const isMedSeverity = (v.penalty || 0) >= 8

          return (
            <motion.div
              key={v._id || i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '4px',
                paddingBottom: '12px',
                paddingTop: '12px'
              }}
            >
              {/* Dot */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `${meta.color}18`,
                  border: `1px solid ${meta.color}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  zIndex: 1,
                  position: 'relative'
                }}>
                  {meta.icon}
                </div>
              </div>

              {/* Content */}
              <div style={{ flex: 1, paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '600', fontSize: '13px', color: '#E2E8F0' }}>
                      {meta.label}
                    </span>
                    {isHighSeverity && (
                      <span style={{
                        fontSize: '10px', fontWeight: '700', padding: '1px 6px',
                        borderRadius: '4px', background: 'rgba(239,68,68,0.15)',
                        color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.5px'
                      }}>Critical</span>
                    )}
                    {!isHighSeverity && isMedSeverity && (
                      <span style={{
                        fontSize: '10px', fontWeight: '700', padding: '1px 6px',
                        borderRadius: '4px', background: 'rgba(249,115,22,0.15)',
                        color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.5px'
                      }}>High</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '700',
                      color: meta.color,
                      padding: '2px 8px',
                      background: `${meta.color}15`,
                      borderRadius: '10px'
                    }}>
                      -{v.penalty} pts
                    </span>
                    <span style={{ fontSize: '11px', color: '#475569' }}>
                      {format(new Date(v.timestamp), 'HH:mm:ss')}
                    </span>
                  </div>
                </div>

                {/* Extra info */}
                {(v.duration || v.meta?.url) && (
                  <div style={{ marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {v.duration && (
                      <span style={{ fontSize: '11px', color: '#475569' }}>
                        Duration: {v.duration}s
                      </span>
                    )}
                    {v.meta?.contentLength && (
                      <span style={{ fontSize: '11px', color: '#475569' }}>
                        Content: {v.meta.contentLength} chars
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
