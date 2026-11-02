// ===================
// ©AngelaMos | 2026
// index.tsx
//
// Dashboard route that composes the four main analytics panels and MITRE Navigator
// ===================

import { useState } from 'react'
import { LuShieldAlert } from 'react-icons/lu'
import {
  useDashboardOverview,
  useSeverityBreakdown,
  useTopSources,
} from '@/api/hooks'
import { MitreMatrixModal } from '@/core/app/mitre-matrix-modal'
import { EventTimeline } from './components/event-timeline'
import { SeverityChart } from './components/severity-chart'
import { StatCards } from './components/stat-cards'
import { TopSources } from './components/top-sources'
import styles from './dashboard.module.scss'

export function Component(): React.ReactElement {
  const overview = useDashboardOverview()
  const severity = useSeverityBreakdown()
  const topSources = useTopSources()
  const [mitreOpen, setMitreOpen] = useState(false)

  return (
    <div className={styles.page}>
      <div className={styles.mitreBanner}>
        <div className={styles.mitreInfo}>
          <LuShieldAlert size={24} color="#60a5fa" />
          <div>
            <div className={styles.mitreTitle}>
              MITRE ATT&CK® Enterprise Coverage Active
            </div>
            <div className={styles.mitreSubtitle}>
              Detection rules and correlation streams mapped to 14 tactical kill chain phases
            </div>
          </div>
        </div>
        <button
          type="button"
          className={styles.mitreBtn}
          onClick={() => setMitreOpen(true)}
        >
          <span>Explore MITRE Matrix</span>
        </button>
      </div>

      <StatCards data={overview.data} isLoading={overview.isLoading} />
      <EventTimeline />
      <div className={styles.row}>
        <SeverityChart data={severity.data} isLoading={severity.isLoading} />
        <TopSources data={topSources.data} isLoading={topSources.isLoading} />
      </div>

      <MitreMatrixModal isOpen={mitreOpen} onClose={() => setMitreOpen(false)} />
    </div>
  )
}

Component.displayName = 'Dashboard'
