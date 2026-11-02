// ===================
// ©AngelaMos | 2026
// index.tsx
//
// Enterprise SIEM Alert List with Threat Intelligence, SOAR Containment,
// Cyber Kill Chain, MITRE ATT&CK Matrix, UEBA, and Forensic Integrity
// ===================

import { useState } from 'react'
import {
  LuCheck,
  LuChevronLeft,
  LuChevronRight,
  LuCopy,
  LuDownload,
  LuExternalLink,
  LuLock,
  LuShieldAlert,
  LuUserX,
  LuX,
  LuZap,
} from 'react-icons/lu'
import {
  useAlertDetail,
  useAlerts,
  useExecuteSoarAction,
  useUpdateAlertStatus,
} from '@/api/hooks'
import type { Alert } from '@/api/types'
import { ALERT_STATUS_LABELS, SEVERITY_LABELS } from '@/config'
import { MitreMatrixModal } from '@/core/app/mitre-matrix-modal'
import styles from './alerts.module.scss'

const STATUS_STYLE: Record<string, string> = {
  new: styles.statusNew,
  acknowledged: styles.statusAcknowledged,
  investigating: styles.statusInvestigating,
  resolved: styles.statusResolved,
  false_positive: styles.statusFalsePositive,
}

const SEVERITY_ICONS: Record<string, string> = {
  critical: '⬢',
  high: '▲',
  medium: '◆',
  low: '●',
  info: 'ℹ',
}

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'false_positive', label: 'False Positive' },
]

export function Component(): React.ReactElement {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mitreModalOpen, setMitreModalOpen] = useState(false)

  const { data, isLoading } = useAlerts({
    page,
    per_page: 25,
    ...(statusFilter && { status: statusFilter }),
  })

  return (
    <div className={styles.page}>
      <div className={styles.headerActions}>
        <div className={styles.tabs}>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`${styles.tab} ${statusFilter === tab.value ? styles.active : ''}`}
              onClick={() => {
                setStatusFilter(tab.value)
                setPage(1)
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.mitreBtn}
          onClick={() => setMitreModalOpen(true)}
          title="Open interactive MITRE ATT&CK Enterprise Matrix"
        >
          <LuShieldAlert size={16} />
          <span>MITRE ATT&CK® Navigator</span>
        </button>
      </div>

      <div className={styles.list}>
        {isLoading ? (
          Array.from({ length: 5 }, (_, i) => (
            <div key={`skel-${i}`} className={styles.cardSkeleton} />
          ))
        ) : data?.items.length === 0 ? (
          <div className={styles.empty}>No alerts found</div>
        ) : (
          data?.items.map((alert, index) => (
            <div
              key={alert.id}
              className={styles.alertItemWrapper}
              style={{ ['--stagger-index' as string]: index }}
            >
              <AlertCard
                alert={alert}
                isSelected={selectedId === alert.id}
                onSelect={() =>
                  setSelectedId(selectedId === alert.id ? null : alert.id)
                }
              />
              {selectedId === alert.id && (
                <div className={styles.inlineDetail}>
                  <AlertDetailPanel
                    alertId={selectedId}
                    onClose={() => setSelectedId(null)}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {data && data.pages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <LuChevronLeft />
          </button>
          <span className={styles.pageInfo}>
            {page} / {data.pages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={page >= data.pages}
            onClick={() => setPage(page + 1)}
          >
            <LuChevronRight />
          </button>
        </div>
      )}

      <MitreMatrixModal
        isOpen={mitreModalOpen}
        onClose={() => setMitreModalOpen(false)}
      />
    </div>
  )
}

Component.displayName = 'Alerts'

function CopyableIOC({
  value,
  label,
}: {
  value: string
  label?: string
}): React.ReactElement {
  const [copied, setCopied] = useState(false)

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    void navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <span
      className={styles.copyableIoc}
      onClick={handleCopy}
      title="Click to copy IOC indicator"
    >
      <span>{label ?? value}</span>
      {copied ? <LuCheck size={12} color="#4ade80" /> : <LuCopy size={12} />}
    </span>
  )
}

function AlertCard({
  alert,
  isSelected,
  onSelect,
}: {
  alert: Alert
  isSelected: boolean
  onSelect: () => void
}): React.ReactElement {
  const glowClass =
    alert.severity === 'critical'
      ? styles.criticalGlow
      : alert.severity === 'high'
        ? styles.highGlow
        : ''

  const icon = SEVERITY_ICONS[alert.severity] ?? '●'

  return (
    <button
      type="button"
      className={`${styles.card} ${glowClass} ${isSelected ? styles.selected : ''}`}
      onClick={onSelect}
    >
      <div className={styles.cardTop}>
        <span className={`${styles.severityBadge} ${styles[alert.severity]}`}>
          {icon} {alert.severity}
        </span>
        <span
          className={`${styles.statusBadge} ${STATUS_STYLE[alert.status] ?? ''}`}
        >
          {ALERT_STATUS_LABELS[alert.status] ?? alert.status}
        </span>
      </div>
      <h3 className={styles.cardTitle}>{alert.title}</h3>
      <div className={styles.cardMeta}>
        <span>{alert.rule_name}</span>
        {alert.group_value && (
          <CopyableIOC value={alert.group_value} label={`Target: ${alert.group_value}`} />
        )}
        <span>{alert.matched_event_count} events</span>
        <span>
          {new Date(alert.created_at).toLocaleString([], {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
      {alert.mitre_technique && (
        <a
          href={`https://attack.mitre.org/techniques/${alert.mitre_technique.replace('.', '/')}/`}
          target="_blank"
          rel="noreferrer"
          className={styles.mitre}
          onClick={(e) => e.stopPropagation()}
          title="Inspect technique in MITRE ATT&CK framework"
        >
          {alert.mitre_technique}
        </a>
      )}
    </button>
  )
}

function AlertDetailPanel({
  alertId,
  onClose,
}: {
  alertId: string
  onClose: () => void
}): React.ReactElement {
  const { data, isLoading } = useAlertDetail(alertId)
  const updateStatus = useUpdateAlertStatus(alertId)
  const executeSoar = useExecuteSoarAction(alertId)

  const [copiedSigma, setCopiedSigma] = useState(false)

  if (isLoading || !data) {
    return (
      <div className={styles.detail}>
        <div className={styles.detailSkeleton} />
      </div>
    )
  }

  const {
    alert,
    matched_events,
    threat_intel,
    soar_actions,
    is_contained,
    evidence_hash,
    ueba_analysis,
    kill_chain,
    sigma_yaml,
    forensic_report,
  } = data

  const statusActions = [
    { status: 'acknowledged', label: 'Acknowledge' },
    { status: 'investigating', label: 'Investigate' },
    { status: 'resolved', label: 'Resolve' },
    { status: 'false_positive', label: 'False Positive' },
  ].filter((a) => a.status !== alert.status)

  const handleDownloadForensicReport = () => {
    if (!forensic_report) return
    const blob = new Blob([forensic_report], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Forensic_Investigation_Report_${alert.id}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleCopySigma = () => {
    if (!sigma_yaml) return
    void navigator.clipboard.writeText(sigma_yaml)
    setCopiedSigma(true)
    setTimeout(() => setCopiedSigma(false), 1500)
  }

  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <h3 className={styles.detailTitle}>{alert.title}</h3>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          <LuX />
        </button>
      </div>

      {/* Forensic Verification Badge */}
      {evidence_hash && (
        <div className={styles.forensicBanner}>
          <span>
            🛡️ <strong>Evidence Chain of Custody:</strong> {evidence_hash.signature} [Verified HMAC-SHA256]
          </span>
          <button
            type="button"
            className={styles.tiLinkBtn}
            onClick={handleDownloadForensicReport}
            title="Download publication-ready Forensic Incident Report"
          >
            <LuDownload size={13} />
            <span>Download Case Report</span>
          </button>
        </div>
      )}

      {/* Detail Core Info */}
      <div className={styles.detailInfo}>
        <InfoField label="Rule" value={alert.rule_name} />
        <InfoField
          label="Severity"
          value={SEVERITY_LABELS[alert.severity] ?? alert.severity}
        />
        <InfoField
          label="Status"
          value={ALERT_STATUS_LABELS[alert.status] ?? alert.status}
        />
        <InfoField
          label="Target IOC"
          value={
            alert.group_value ? (
              <CopyableIOC value={alert.group_value} />
            ) : null
          }
        />
        <InfoField label="Events" value={alert.matched_event_count.toString()} />
        <InfoField
          label="Created"
          value={new Date(alert.created_at).toLocaleString()}
        />
        {alert.mitre_tactic && (
          <InfoField label="MITRE Tactic" value={alert.mitre_tactic} />
        )}
        {alert.mitre_technique && (
          <InfoField
            label="MITRE Technique"
            value={
              <a
                href={`https://attack.mitre.org/techniques/${alert.mitre_technique.replace('.', '/')}/`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#60a5fa', textDecoration: 'underline' }}
              >
                {alert.mitre_technique}
              </a>
            }
          />
        )}
        {alert.acknowledged_by && (
          <InfoField label="Acknowledged By" value={alert.acknowledged_by} />
        )}
      </div>

      {/* Lifecycle Actions */}
      <div className={styles.actions}>
        {statusActions.map((action) => (
          <button
            key={action.status}
            type="button"
            className={styles.actionBtn}
            disabled={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ status: action.status })}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* SOAR Automated Containment Widget */}
      <div className={styles.soarBox}>
        <div className={styles.sectionTitle}>
          <span>⚡ SOAR Active Defense & Automated Containment</span>
          {is_contained && (
            <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 600 }}>
              🛡️ TARGET QUARANTINED
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: '#9ba3af', marginBottom: 8 }}>
          Dispatch automated remediation playbooks directly to network firewalls and host agents:
        </p>
        <div className={styles.soarActionsGrid}>
          <button
            type="button"
            className={`${styles.soarActionBtn} ${is_contained ? styles.contained : ''}`}
            disabled={executeSoar.isPending}
            onClick={() =>
              executeSoar.mutate({
                action: 'block_ip',
                target: alert.group_value ?? undefined,
              })
            }
          >
            <LuLock size={14} />
            <span>{is_contained ? 'Target Quarantined (Rule Active)' : 'Block Target IP (Firewall Drop)'}</span>
          </button>

          <button
            type="button"
            className={styles.soarActionBtn}
            disabled={executeSoar.isPending}
            onClick={() =>
              executeSoar.mutate({
                action: 'quarantine_host',
                target: alert.group_value ?? 'host-endpoint',
              })
            }
          >
            <LuZap size={14} />
            <span>Isolate Compromised Host</span>
          </button>

          <button
            type="button"
            className={styles.soarActionBtn}
            disabled={executeSoar.isPending}
            onClick={() =>
              executeSoar.mutate({
                action: 'disable_user',
                target: alert.group_value ?? 'root',
              })
            }
          >
            <LuUserX size={14} />
            <span>Revoke Account Credentials</span>
          </button>
        </div>

        {soar_actions && soar_actions.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 11, color: '#9ba3af' }}>
            <strong>Containment History:</strong>
            <ul style={{ paddingLeft: 16, marginTop: 4 }}>
              {soar_actions.map((act: any) => (
                <li key={act.id}>
                  {act.description} [{act.operator} at{' '}
                  {new Date(act.timestamp).toLocaleTimeString()}]
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Threat Intelligence (TI) Scorecard */}
      {threat_intel?.has_intel && (
        <div className={styles.socSection}>
          <div className={styles.sectionTitle}>
            <span>🌐 Threat Intelligence Profile (AbuseIPDB / AlienVault)</span>
            <span
              style={{
                color:
                  threat_intel.verdict === 'MALICIOUS'
                    ? '#ef4444'
                    : threat_intel.verdict === 'SUSPICIOUS'
                      ? '#f59e0b'
                      : '#4ade80',
                fontWeight: 600,
              }}
            >
              {threat_intel.verdict} ({threat_intel.abuse_score}% Risk)
            </span>
          </div>

          <div className={styles.tiGrid}>
            <div className={styles.tiStat}>
              <div className={styles.tiLabel}>Origin Geolocation</div>
              <div className={styles.tiVal}>
                {threat_intel.flag} {threat_intel.country} ({threat_intel.city})
              </div>
            </div>
            <div className={styles.tiStat}>
              <div className={styles.tiLabel}>ISP / Autonomous System</div>
              <div className={styles.tiVal}>
                {threat_intel.isp} ({threat_intel.asn})
              </div>
            </div>
            <div className={styles.tiStat}>
              <div className={styles.tiLabel}>Abuse Reports & Vendor Detections</div>
              <div className={styles.tiVal}>
                {threat_intel.virustotal_ratio}
              </div>
            </div>
          </div>

          {threat_intel.threat_types && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              {threat_intel.threat_types.map((type: string) => (
                <span
                  key={type}
                  style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {type}
                </span>
              ))}
            </div>
          )}

          {threat_intel.lookup_urls && (
            <div className={styles.tiLinks}>
              {Object.entries(threat_intel.lookup_urls).map(([provider, url]) => (
                <a
                  key={provider}
                  href={url as string}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.tiLinkBtn}
                >
                  <span>{provider.toUpperCase()}</span>
                  <LuExternalLink size={10} />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cyber Kill Chain Progression Timeline */}
      {kill_chain?.stages && (
        <div className={styles.socSection}>
          <div className={styles.sectionTitle}>
            <span>🔗 Cyber Kill Chain Progression (Incident Merging)</span>
            <span style={{ color: '#60a5fa', fontWeight: 600 }}>
              {kill_chain.incident_label}
            </span>
          </div>

          <div className={styles.killChainProgress}>
            {kill_chain.stages.map((st: any) => (
              <div key={st.stage} className={styles.killChainStep}>
                <div
                  className={`${styles.killChainNode} ${st.completed ? styles.active : ''}`}
                >
                  {st.stage}
                </div>
                <div className={styles.killChainLabel}>{st.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UEBA Behavioral Anomaly Analysis */}
      {ueba_analysis && (
        <div className={styles.socSection}>
          <div className={styles.sectionTitle}>
            <span>🧠 User & Entity Behavior Analytics (UEBA)</span>
            <span
              style={{
                color:
                  ueba_analysis.risk_level === 'CRITICAL'
                    ? '#ef4444'
                    : ueba_analysis.risk_level === 'HIGH'
                      ? '#f97316'
                      : '#60a5fa',
                fontWeight: 600,
              }}
            >
              Anomaly Score: {ueba_analysis.anomaly_score}/100 ({ueba_analysis.baseline_deviation})
            </span>
          </div>
          {ueba_analysis.detected_anomalies?.map((anom: any, idx: number) => (
            <div
              key={`anom-${idx}`}
              style={{
                fontSize: 11,
                padding: '4px 8px',
                marginBottom: 4,
                borderRadius: 4,
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                color: '#fdba74',
              }}
            >
              <strong>{anom.type}:</strong> {anom.detail}
            </div>
          ))}
        </div>
      )}

      {/* Sigma Rule Standard Viewer */}
      {sigma_yaml && (
        <div className={styles.socSection}>
          <div className={styles.sectionTitle}>
            <span>📜 Sigma Detection Rule Standard (YAML)</span>
            <button
              type="button"
              className={styles.tiLinkBtn}
              onClick={handleCopySigma}
            >
              {copiedSigma ? <LuCheck size={12} color="#4ade80" /> : <LuCopy size={12} />}
              <span>{copiedSigma ? 'Copied YAML!' : 'Copy Sigma Rule'}</span>
            </button>
          </div>
          <pre className={styles.codeBox}>{sigma_yaml}</pre>
        </div>
      )}

      {/* Matched Log Events */}
      {matched_events.length > 0 && (
        <div className={styles.matchedEvents}>
          <h4 className={styles.matchedTitle}>
            Correlated Forensic Log Events ({matched_events.length})
          </h4>
          <div className={styles.eventList}>
            {matched_events.slice(0, 20).map((event) => (
              <div key={event.id} className={styles.eventRow}>
                <span className={styles.eventTime}>
                  {new Date(event.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
                <span
                  className={`${styles.severityBadge} ${styles[event.severity]}`}
                >
                  {event.severity}
                </span>
                <span className={styles.eventType}>
                  {event.event_type ?? '\u2014'}
                </span>
                <span className={styles.eventIp}>
                  {event.source_ip ? (
                    <CopyableIOC value={event.source_ip} />
                  ) : (
                    '\u2014'
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoField({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}): React.ReactElement | null {
  if (value === null || value === undefined) return null
  return (
    <div className={styles.infoField}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}
