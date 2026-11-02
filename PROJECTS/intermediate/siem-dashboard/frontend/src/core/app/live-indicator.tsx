// ===================
// live-indicator.tsx
//
// "Living System" Real-Time Stream Radar Beacon & Audio Visualizer Pill
// ===================

import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/config'
import { useNotificationStore } from '@/core/stores'
import styles from './live-indicator.module.scss'

export function LiveIndicator(): React.ReactElement {
  const navigate = useNavigate()
  const activeAlerts = useNotificationStore((s) => s.activeUrgentAlerts)
  const hasActiveUrgent = Object.keys(activeAlerts).length > 0

  return (
    <div className={styles.indicatorGroup}>
      <div
        className={styles.livePill}
        title="Real-time Redis SSE stream active | Zero-latency event pipeline"
      >
        <span className={styles.radarBeacon} />
        <span>Live Feed</span>
      </div>

      {hasActiveUrgent && (
        <button
          type="button"
          className={styles.visualizerPill}
          onClick={() => navigate(ROUTES.ALERTS)}
          title="Urgent threat detected - Click to triage active alerts"
        >
          <div className={styles.equalizerBars}>
            <span />
            <span />
            <span />
          </div>
          <span>Threat Alarm</span>
        </button>
      )}
    </div>
  )
}
