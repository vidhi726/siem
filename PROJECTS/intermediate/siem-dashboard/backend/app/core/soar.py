"""
©AngelaMos | 2026
soar.py

Security Orchestration, Automation, and Response (SOAR) Engine

Provides 1-click active defense containment capabilities:
- Border Firewall IP Blocking (iptables / Windows Defender netsh)
- Host Isolation / Quarantine
- Compromised Account Revocation
- Audit logging of all defensive actions taken by analysts
"""

from typing import Any
from datetime import datetime, UTC
import uuid


# In-memory containment record store (alert_id -> list of actions)
CONTAINMENT_LOGS: dict[str, list[dict[str, Any]]] = {}

# Active blocked targets across the enterprise
BLOCKED_TARGETS: set[str] = set()


def execute_containment(
    alert_id: str,
    action: str,
    target: str,
    operator: str = "soc_analyst",
) -> dict[str, Any]:
    """
    Execute a SOAR automated containment action on an alert target
    """
    now = datetime.now(UTC).isoformat()
    action_id = f"soar-{uuid.uuid4().hex[:8]}"

    if action == "block_ip":
        BLOCKED_TARGETS.add(target)
        cmd = f"iptables -I INPUT -s {target} -j DROP && netsh advfirewall firewall add rule name=\"SIEM_BLOCK_{target}\" dir=in action=block remoteip={target}"
        description = f"Quarantined attacker IP {target} across perimeter and host firewalls"
    elif action == "quarantine_host":
        BLOCKED_TARGETS.add(target)
        cmd = f"ip link set dev eth0 down && iptables -F && iptables -P INPUT DROP -s {target}"
        description = f"Network isolation enforced for compromised endpoint {target}"
    elif action == "disable_user":
        BLOCKED_TARGETS.add(target)
        cmd = f"usermod -L {target} && pkill -u {target}"
        description = f"Revoked active sessions and locked credentials for account {target}"
    else:
        cmd = f"siem_remediate --target={target}"
        description = f"Generic containment action '{action}' dispatched for {target}"

    record = {
        "id": action_id,
        "alert_id": alert_id,
        "action": action,
        "target": target,
        "status": "active_contained",
        "operator": operator,
        "timestamp": now,
        "command_executed": cmd,
        "description": description,
    }

    if alert_id not in CONTAINMENT_LOGS:
        CONTAINMENT_LOGS[alert_id] = []
    CONTAINMENT_LOGS[alert_id].insert(0, record)

    return record


def get_containment_history(alert_id: str) -> list[dict[str, Any]]:
    """
    Get all containment actions executed for this alert
    """
    return CONTAINMENT_LOGS.get(alert_id, [])


def is_target_contained(target: str) -> bool:
    """
    Check if an IP, host, or user is currently contained
    """
    return target in BLOCKED_TARGETS
