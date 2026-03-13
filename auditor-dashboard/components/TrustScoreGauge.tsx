'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface Props {
  score: number
  size?: number
  showLabel?: boolean
  animated?: boolean
}

export default function TrustScoreGauge({ score, size = 180, showLabel = true, animated = true }: Props) {
  const clampedScore = Math.max(0, Math.min(100, score))
  const color = clampedScore >= 90 ? '#22C55E' : clampedScore >= 70 ? '#FACC15' : '#EF4444'
  const riskLabel = clampedScore >= 90 ? 'TRUSTED' : clampedScore >= 70 ? 'SUSPICIOUS' : 'HIGH RISK'

  // SVG arc calculations
  const radius = size * 0.38
  const cx = size / 2
  const cy = size / 2
  const strokeWidth = size * 0.07
  const circumference = Math.PI * radius // Half circle

  // Gauge goes from -180deg to 0deg (left to right along bottom half)
  const startAngle = -180
  const endAngle = 0
  const totalAngle = endAngle - startAngle

  const scoreAngle = startAngle + (clampedScore / 100) * totalAngle
  const scoreRad = (scoreAngle * Math.PI) / 180

  // Track path (half circle)
  const trackPath = describeArc(cx, cy, radius, -180, 0)

  // Score dash
  const fillRatio = clampedScore / 100
  const dashOffset = circumference * (1 - fillRatio)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size * 0.6 }}>
        <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
          {/* Glow filter */}
          <defs>
            <filter id={`glow-${score}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id={`scoreGrad-${score}`} gradientUnits="userSpaceOnUse"
              x1={cx - radius} y1={cy} x2={cx + radius} y2={cy}>
              <stop offset="0%" stopColor={clampedScore < 70 ? '#EF4444' : '#FACC15'} />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>

          {/* Background track */}
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map(pct => {
            const ang = (startAngle + (pct / 100) * totalAngle) * (Math.PI / 180)
            const r1 = radius + strokeWidth / 2 + 4
            const r2 = radius + strokeWidth / 2 + 10
            return (
              <line
                key={pct}
                x1={cx + r1 * Math.cos(ang)}
                y1={cy + r1 * Math.sin(ang)}
                x2={cx + r2 * Math.cos(ang)}
                y2={cy + r2 * Math.sin(ang)}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )
          })}

          {/* Score arc */}
          {animated ? (
            <motion.path
              d={trackPath}
              fill="none"
              stroke={`url(#scoreGrad-${score})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              filter={`url(#glow-${score})`}
            />
          ) : (
            <path
              d={trackPath}
              fill="none"
              stroke={`url(#scoreGrad-${score})`}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              filter={`url(#glow-${score})`}
            />
          )}

          {/* Needle dot */}
          <motion.circle
            cx={cx + radius * Math.cos(scoreRad)}
            cy={cy + radius * Math.sin(scoreRad)}
            r={strokeWidth / 2 + 2}
            fill={color}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />

          {/* Center text */}
          <text x={cx} y={cy - 2} textAnchor="middle" fill="#F1F5F9"
            fontSize={size * 0.2} fontWeight="800" fontFamily="Inter, sans-serif">
            {clampedScore}
          </text>
          <text x={cx} y={cy + size * 0.12} textAnchor="middle" fill="#64748B"
            fontSize={size * 0.075} fontFamily="Inter, sans-serif" fontWeight="500">
            / 100
          </text>
        </svg>
      </div>

      {showLabel && (
        <div style={{
          padding: '6px 18px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color,
          background: `${color}18`,
          border: `1px solid ${color}33`
        }}>
          {riskLabel}
        </div>
      )}
    </div>
  )
}

// SVG arc path helper
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}
