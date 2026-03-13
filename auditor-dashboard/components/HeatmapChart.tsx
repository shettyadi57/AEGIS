'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { motion } from 'framer-motion'

interface Props {
  data: { _id: number; count: number }[]
  violationDistribution?: { _id: string; count: number }[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#1E293B',
        border: '1px solid rgba(79,156,249,0.2)',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '13px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
      }}>
        <p style={{ color: '#94A3B8', margin: '0 0 4px', fontSize: '11px' }}>Hour {label}:00</p>
        <p style={{ color: '#4F9CF9', fontWeight: '700', margin: 0 }}>
          {payload[0].value} violations
        </p>
      </div>
    )
  }
  return null
}

export default function HeatmapChart({ data, violationDistribution }: Props) {
  // Fill in missing hours with 0
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const found = data?.find(d => d._id === i)
    return { hour: i, count: found?.count || 0, label: `${i}h` }
  })

  const maxCount = Math.max(...hourlyData.map(d => d.count), 1)

  // Top violation types for bar chart
  const topViolations = (violationDistribution || []).slice(0, 8)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* Hourly Activity */}
      <div style={{
        background: '#121826',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '20px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F1F5F9', margin: '0 0 4px' }}>
            Hourly Activity Heatmap
          </h3>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Last 24 hours violation density</p>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={hourlyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F9CF9" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F9CF9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#475569', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#4F9CF9"
              strokeWidth={2}
              fill="url(#areaGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#4F9CF9', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Heatmap grid */}
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Intensity Grid
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '3px' }}>
            {hourlyData.map(d => {
              const intensity = maxCount > 0 ? d.count / maxCount : 0
              const alpha = 0.1 + intensity * 0.7
              return (
                <div
                  key={d.hour}
                  title={`${d.hour}:00 — ${d.count} violations`}
                  style={{
                    height: '24px',
                    borderRadius: '4px',
                    background: d.count === 0
                      ? 'rgba(255,255,255,0.04)'
                      : `rgba(${intensity > 0.6 ? '239,68,68' : intensity > 0.3 ? '250,204,21' : '79,156,249'},${alpha})`,
                    cursor: 'default',
                    transition: 'transform 0.15s',
                    position: 'relative'
                  }}
                />
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '10px', color: '#374151' }}>12am</span>
            <span style={{ fontSize: '10px', color: '#374151' }}>12pm</span>
            <span style={{ fontSize: '10px', color: '#374151' }}>11pm</span>
          </div>
        </div>
      </div>

      {/* Top Violations */}
      <div style={{
        background: '#121826',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '20px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#F1F5F9', margin: '0 0 4px' }}>
            Violation Distribution
          </h3>
          <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Most frequent violation types</p>
        </div>

        {topViolations.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#475569', fontSize: '13px' }}>
            No violations yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {topViolations.map((v, i) => {
              const maxVal = topViolations[0]?.count || 1
              const pct = (v.count / maxVal) * 100
              const color = i === 0 ? '#EF4444' : i < 3 ? '#F97316' : i < 5 ? '#FACC15' : '#4F9CF9'

              return (
                <motion.div
                  key={v._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500' }}>
                      {v._id.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color }}>
                      {v.count}
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: i * 0.06 + 0.2, duration: 0.6 }}
                      style={{
                        height: '100%',
                        background: color,
                        borderRadius: '3px'
                      }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
