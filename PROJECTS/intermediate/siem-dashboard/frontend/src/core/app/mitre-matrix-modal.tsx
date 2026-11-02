// ===================
// mitre-matrix-modal.tsx
//
// MITRE ATT&CK Enterprise Matrix Navigator & Coverage Heatmap
// ===================

import { LuShieldAlert, LuX } from 'react-icons/lu'
import { useMitreMatrix } from '@/api/hooks'
import styles from './mitre-matrix-modal.module.scss'

interface MitreMatrixModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MitreMatrixModal({
  isOpen,
  onClose,
}: MitreMatrixModalProps): React.ReactElement | null {
  const { data: matrix, isLoading } = useMitreMatrix()

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <div className={styles.titleGroup}>
            <LuShieldAlert size={20} color="#60a5fa" />
            <h2 className={styles.title}>
              MITRE ATT&CK® Enterprise Navigator
            </h2>
            <span className={styles.badge}>Framework v15.1 Mappings</span>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <LuX />
          </button>
        </div>

        <div className={styles.matrixGrid}>
          {isLoading ? (
            <div style={{ padding: 24, color: '#9ba3af' }}>
              Loading MITRE Enterprise matrix coverage...
            </div>
          ) : (
            matrix?.map((col: any) => (
              <div
                key={col.tactic_id}
                className={`${styles.tacticColumn} ${col.covered ? styles.covered : ''}`}
              >
                <div className={styles.columnHeader}>
                  <div className={styles.tacticId}>{col.tactic_id}</div>
                  <div className={styles.tacticName}>{col.tactic_name}</div>
                  <div className={styles.statsRow}>
                    <span className={styles.rulePill}>
                      {col.rule_count} Rules
                    </span>
                    {col.alert_count > 0 && (
                      <span className={styles.alertPill}>
                        {col.alert_count} Alerts
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.techniquesList}>
                  {col.techniques && col.techniques.length > 0 ? (
                    col.techniques.map((tech: any) => (
                      <a
                        key={tech.id}
                        href={`https://attack.mitre.org/techniques/${tech.id.replace('.', '/')}/`}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.techniqueCard}
                        title={`View technique on MITRE ATT&CK: ${tech.name}`}
                      >
                        <div className={styles.techId}>{tech.id}</div>
                        <div className={styles.techName}>{tech.name}</div>
                      </a>
                    ))
                  ) : (
                    <div className={styles.uncoveredEmpty}>
                      No rules mapped
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
