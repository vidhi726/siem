// ===================
// ©AngelaMos | 2026
// event-timeline.tsx
//
// Animated area chart displaying event counts over time using @visx/xychart
// with localized time scaling, day navigation, and time window presets.
// ===================

import { useEffect, useMemo, useState } from 'react'
import { curveMonotoneX } from '@visx/curve'
import { ParentSize } from '@visx/responsive'
import {
  AnimatedAreaSeries,
  AnimatedAxis,
  AnimatedGrid,
  Tooltip,
  XYChart,
} from '@visx/xychart'
import {
  LuCalendar,
  LuChevronLeft,
  LuChevronRight,
  LuClock,
  LuRadio,
} from 'react-icons/lu'
import { useTimeline } from '@/api/hooks'
import type { TimelineBucket } from '@/api/types'
import { chartTheme } from '@/core/charts'
import styles from './event-timeline.module.scss'

interface PresetOption {
  label: string
  hours: number
  bucketMinutes: number
}

const PRESETS: PresetOption[] = [
  { label: '1H', hours: 1, bucketMinutes: 1 },
  { label: '6H', hours: 6, bucketMinutes: 5 },
  { label: '24H', hours: 24, bucketMinutes: 15 },
  { label: '7D', hours: 168, bucketMinutes: 120 },
  { label: '30D', hours: 720, bucketMinutes: 360 },
]

const xAccessor = (d: TimelineBucket) => new Date(d.bucket)
const yAccessor = (d: TimelineBucket) => d.count

export function EventTimeline(): React.ReactElement {
  const [selectedPreset, setSelectedPreset] = useState<PresetOption>(PRESETS[2]) // 24H default
  const [offsetDays, setOffsetDays] = useState<number>(0)
  const [liveClock, setLiveClock] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const { data, isLoading } = useTimeline(
    selectedPreset.hours,
    selectedPreset.bucketMinutes,
    offsetDays
  )

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    if (data.length === 1) {
      const singleDate = new Date(data[0].bucket).getTime()
      const stepMs = selectedPreset.bucketMinutes * 60 * 1000
      return [
        { bucket: new Date(singleDate - stepMs).toISOString(), count: 0 },
        data[0],
        { bucket: new Date(singleDate + stepMs).toISOString(), count: 0 },
      ]
    }
    return data
  }, [data, selectedPreset.bucketMinutes])

  const totalEvents = useMemo(
    () => (data ? data.reduce((sum, d) => sum + d.count, 0) : 0),
    [data]
  )

  // Compute displayed window range in local time
  const windowRangeText = useMemo(() => {
    const endMs = Date.now() - offsetDays * 24 * 60 * 60 * 1000
    const startMs = endMs - selectedPreset.hours * 60 * 60 * 1000
    const startDate = new Date(startMs)
    const endDate = new Date(endMs)

    if (selectedPreset.hours <= 24) {
      const startStr = startDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
      const endStr = endDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
      const dayStr = endDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      })
      return `${dayStr} (${startStr} – ${endStr})`
    }

    const startStr = startDate.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    })
    const endStr = endDate.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    })
    return `${startStr} – ${endStr}`
  }, [offsetDays, selectedPreset.hours])

  const targetDateLabel = useMemo(() => {
    if (offsetDays === 0) return 'Today'
    if (offsetDays === 1) return 'Yesterday'
    const targetDate = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000)
    return targetDate.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    })
  }, [offsetDays])

  return (
    <div className={styles.panel}>
      {/* Top Header Row */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h3 className={styles.title}>
            <LuRadio color="#60a5fa" size={16} />
            Event Ingestion Timeline
          </h3>

          {offsetDays === 0 ? (
            <span className={styles.liveBadge} title="Real-time live ingestion stream active">
              <span className={styles.liveDot} />
              LIVE
            </span>
          ) : (
            <span
              className={styles.offsetBadge}
              title={`Viewing telemetry from ${offsetDays} day(s) in the past`}
            >
              <LuCalendar size={12} />
              {offsetDays}d Ago ({targetDateLabel})
            </span>
          )}
        </div>

        {/* Controls: Range Presets & Day Navigation */}
        <div className={styles.controls}>
          {/* Day Stepper */}
          <div className={styles.navGroup}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => setOffsetDays((d) => d + 1)}
              title="Step back 1 day"
            >
              <LuChevronLeft size={13} />
              Prev Day
            </button>

            <button
              type="button"
              className={`${styles.navBtn} ${styles.liveBtn}`}
              onClick={() => setOffsetDays(0)}
              title="Jump to current live time"
            >
              {offsetDays === 0 ? 'Today' : 'Back to Today'}
            </button>

            <button
              type="button"
              className={styles.navBtn}
              onClick={() => setOffsetDays((d) => Math.max(0, d - 1))}
              disabled={offsetDays === 0}
              title="Step forward 1 day"
            >
              Next Day
              <LuChevronRight size={13} />
            </button>
          </div>

          {/* Time Window Presets (1H, 6H, 24H, 7D, 30D) */}
          <div className={styles.presetGroup}>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`${styles.presetBtn} ${
                  selectedPreset.label === preset.label ? styles.active : ''
                }`}
                onClick={() => setSelectedPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Meta Information Bar: Local Clock, Active Window, Total Events */}
      <div className={styles.metaRow}>
        <div className={styles.clockBadge}>
          <LuClock size={12} color="#9ba3af" />
          <span>Local Time: {liveClock}</span>
          <span style={{ color: 'hsl(0, 0%, 40%)' }}>•</span>
          <span style={{ color: '#9ba3af' }}>Window: {windowRangeText}</span>
        </div>

        <div className={styles.eventCountBadge}>
          {totalEvents.toLocaleString()} Events Ingested
        </div>
      </div>

      {/* Chart Canvas */}
      {isLoading ? (
        <div className={styles.skeleton} />
      ) : !chartData || chartData.length === 0 ? (
        <div className={styles.emptyState}>
          <LuCalendar size={28} color="#6b7280" />
          <span>No log events recorded for {windowRangeText}</span>
          {offsetDays > 0 && (
            <button
              type="button"
              className={`${styles.presetBtn} ${styles.active}`}
              style={{ marginTop: 8 }}
              onClick={() => setOffsetDays(0)}
            >
              Return to Current Live Stream
            </button>
          )}
        </div>
      ) : (
        <div className={styles.chart}>
          <ParentSize>
            {({ width }) =>
              width > 30 ? (
                <XYChart
                  height={280}
                  width={width}
                  xScale={{ type: 'time' }}
                  yScale={{ type: 'linear', zero: true }}
                  theme={chartTheme}
                >
                  <AnimatedGrid columns={false} numTicks={4} />
                  <AnimatedAxis
                    orientation="bottom"
                    numTicks={selectedPreset.hours <= 1 ? 8 : 6}
                    tickFormat={(val) => {
                      const d = new Date(val)
                      if (selectedPreset.hours <= 24) {
                        return d.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })
                      }
                      return d.toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })
                    }}
                  />
                  <AnimatedAxis orientation="left" numTicks={4} />
                  <AnimatedAreaSeries
                    dataKey="Events"
                    data={chartData}
                    xAccessor={xAccessor}
                    yAccessor={yAccessor}
                    fillOpacity={0.25}
                    curve={curveMonotoneX}
                  />
                  <Tooltip
                    snapTooltipToDatumX
                    showVerticalCrosshair
                    verticalCrosshairStyle={{ stroke: 'hsl(217, 91%, 60%)' }}
                    style={{
                      backgroundColor: 'hsl(222, 47%, 10%)',
                      border: '1px solid hsl(217, 33%, 25%)',
                      borderRadius: '8px',
                      color: 'hsl(0, 0%, 98%)',
                      fontSize: '12px',
                      padding: '8px 12px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                    }}
                    renderTooltip={({ tooltipData }) => {
                      const datum = tooltipData?.nearestDatum?.datum as
                        | TimelineBucket
                        | undefined
                      if (!datum) return null

                      const d = new Date(datum.bucket)
                      const timeStr = d.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: selectedPreset.hours <= 1 ? '2-digit' : undefined,
                        hour12: false,
                      })
                      const dateStr = d.toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })

                      return (
                        <div>
                          <div
                            style={{
                              color: '#9ba3af',
                              marginBottom: 4,
                              fontFamily: 'monospace',
                              fontSize: 11,
                            }}
                          >
                            {dateStr} • {timeStr} (Local)
                          </div>
                          <div
                            style={{
                              fontWeight: 700,
                              color: '#4ade80',
                              fontSize: 13,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#4ade80',
                                display: 'inline-block',
                              }}
                            />
                            {datum.count.toLocaleString()} Events
                          </div>
                        </div>
                      )
                    }}
                  />
                </XYChart>
              ) : null
            }
          </ParentSize>
        </div>
      )}
    </div>
  )
}
