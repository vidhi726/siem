"""
©AngelaMos | 2026
alert_ctrl.py

Business logic for alert operations

Handles:
- Paginated listing with status and severity filters
- Single alert retrieval with matched events, Threat Intelligence (TI),
  SOAR containment status, Forensic evidence hash, UEBA anomaly scores,
  Sigma rule representation, and Kill Chain correlation
- 1-Click SOAR automated containment execution
- Status lifecycle transitions
- SSE real-time alert stream
- MITRE ATT&CK Matrix summary aggregation
"""

from typing import Any

from flask import Response, g

from app.config import settings
from app.core.streaming import sse_generator
from app.models.Alert import Alert
from app.models.CorrelationRule import CorrelationRule
from app.core import threat_intel, soar, forensics, sigma, mitre, ueba


def list_alerts() -> dict[str, Any]:
    """
    Return paginated and filtered alerts
    """
    params = g.validated
    filters = {}
    if params.status:
        filters["status"] = params.status
    if params.severity:
        filters["severity"] = params.severity

    qs = Alert.objects(**filters).order_by("-created_at")
    return Alert.paginate(
        queryset=qs,
        page=params.page,
        per_page=params.per_page,
    )


def get_alert_detail(alert_id: str) -> dict[str, Any]:
    """
    Return an alert with its matched log events and enterprise SOC enrichments
    """
    alert = Alert.get_by_id(alert_id)
    base_detail = alert.get_with_events()
    matched_events = base_detail.get("matched_events", [])

    # Determine primary indicator (group_value or source_ip from events)
    target_indicator = alert.group_value
    if not target_indicator and matched_events:
        target_indicator = getattr(matched_events[0], "source_ip", None)

    # 1. Threat Intelligence Enrichment
    ti_data = threat_intel.enrich_ip(target_indicator)

    # 2. SOAR Active Containment History
    soar_history = soar.get_containment_history(alert_id)
    is_contained = soar.is_target_contained(target_indicator or "")

    # 3. Cryptographic Forensic Hash
    ev_hash = forensics.compute_evidence_hash({
        "id": str(alert.id),
        "created_at": alert.created_at.isoformat() if alert.created_at else "",
        "rule_name": alert.rule_name,
        "group_value": alert.group_value,
        "matched_event_count": alert.matched_event_count,
    })

    # 4. UEBA Behavioral Anomaly Analysis
    ueba_data = ueba.analyze_ueba(alert, matched_events)

    # 5. Cyber Kill Chain Multi-Stage Correlation
    all_recent_alerts = list(Alert.objects().order_by("-created_at")[:50])
    kill_chain_data = ueba.correlate_kill_chain(alert, all_recent_alerts)

    # 6. Sigma Rule Representation
    rule_obj = CorrelationRule.objects(id=alert.rule_id).first() if alert.rule_id else None
    sigma_yaml = sigma.convert_to_sigma_yaml(rule_obj or alert)

    # 7. Forensic Markdown Report
    forensic_md = forensics.generate_forensic_report(alert, matched_events, ti_data)

    return {
        "alert": alert,
        "matched_events": matched_events,
        "threat_intel": ti_data,
        "soar_actions": soar_history,
        "is_contained": is_contained,
        "evidence_hash": ev_hash,
        "ueba_analysis": ueba_data,
        "kill_chain": kill_chain_data,
        "sigma_yaml": sigma_yaml,
        "forensic_report": forensic_md,
    }


def execute_soar_action(alert_id: str) -> dict[str, Any]:
    """
    Execute a SOAR containment action on this alert's target
    """
    data = g.validated
    alert = Alert.get_by_id(alert_id)

    target = data.target or alert.group_value
    if not target:
        base_detail = alert.get_with_events()
        events = base_detail.get("matched_events", [])
        if events:
            target = getattr(events[0], "source_ip", "127.0.0.1")
        else:
            target = "127.0.0.1"

    operator = "soc_analyst"
    if g.current_user:
        operator = g.current_user.username

    action = getattr(data, "action", "block_ip")
    record = soar.execute_containment(
        alert_id=alert_id,
        action=action,
        target=target,
        operator=operator,
    )

    # If action was successful, add analyst note to alert
    notes = alert.notes or ""
    action_note = f"\n[SOAR Containment] {record['description']} by {operator} at {record['timestamp']}"
    alert.notes = (notes + action_note).strip()
    alert.save()

    return record


def get_mitre_matrix() -> list[dict[str, Any]]:
    """
    Return the MITRE ATT&CK coverage matrix across rules and alerts
    """
    rules = list(CorrelationRule.objects())
    alerts = list(Alert.objects()[:200])
    return mitre.get_mitre_coverage(rules, alerts)


def update_alert_status(alert_id: str) -> Alert:
    """
    Transition an alert to a new lifecycle status
    """
    data = g.validated
    alert = Alert.get_by_id(alert_id)
    username = None
    if g.current_user:
        username = g.current_user.username
    alert.update_status(
        status=data.status,
        username=username,
        notes=data.notes,
    )
    return alert


def stream_alerts() -> Response:
    """
    SSE endpoint that tails the alert Redis Stream
    """
    return Response(
        sse_generator(settings.ALERT_STREAM_KEY, event_type="alert"),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
