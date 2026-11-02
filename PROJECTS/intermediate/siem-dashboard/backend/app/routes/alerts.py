"""
©AngelaMos | 2026
alerts.py

Route handlers for the alerts API (/v1/alerts)

Mounts:
- GET / - paginated alerts
- GET /stream - real-time SSE stream
- GET /mitre-matrix - MITRE ATT&CK enterprise matrix coverage
- GET /<alert_id> - alert detail with matched events and TI/SOAR/UEBA enrichment
- POST /<alert_id>/soar - execute automated containment action
- PATCH /<alert_id>/status - transition alert status
"""

from typing import Any

from flask import Blueprint

from app.controllers import alert_ctrl
from app.core.decorators import endpoint, S, R
from app.schemas.alert import AlertStatusUpdate, AlertQueryParams, SoarActionRequest

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.get("")
@endpoint()
@S(AlertQueryParams, source="query")
@R()
def list_alerts() -> Any:
    """
    Return paginated and filtered alerts
    """
    return alert_ctrl.list_alerts()


@alerts_bp.get("/stream")
@endpoint()
def stream_alerts() -> Any:
    """
    SSE stream of real-time alerts
    """
    return alert_ctrl.stream_alerts()


@alerts_bp.get("/mitre-matrix")
@endpoint()
@R()
def get_mitre_matrix() -> Any:
    """
    Return MITRE ATT&CK matrix coverage summary
    """
    return alert_ctrl.get_mitre_matrix()


@alerts_bp.get("/<alert_id>")
@endpoint()
@R()
def get_alert_detail(alert_id: str) -> Any:
    """
    Return an alert with its matched log events and enterprise SOC enrichments
    """
    return alert_ctrl.get_alert_detail(alert_id)


@alerts_bp.post("/<alert_id>/soar")
@endpoint()
@S(SoarActionRequest)
@R()
def execute_soar_action(alert_id: str) -> Any:
    """
    Execute a SOAR automated containment action (firewall block, quarantine)
    """
    return alert_ctrl.execute_soar_action(alert_id)


@alerts_bp.patch("/<alert_id>/status")
@endpoint()
@S(AlertStatusUpdate)
@R()
def update_alert_status(alert_id: str) -> Any:
    """
    Transition an alert to a new lifecycle status
    """
    return alert_ctrl.update_alert_status(alert_id)
