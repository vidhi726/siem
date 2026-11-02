"""
©AngelaMos | 2026
sigma.py

Sigma Standard Rule Converter

Converts internal SIEM correlation rules into the generic Sigma (YAML)
standard recognized across the cybersecurity community (SigmaHQ).
"""

from typing import Any
import yaml


def convert_to_sigma_yaml(rule: Any) -> str:
    """
    Generate an official Sigma YAML document from a CorrelationRule model
    """
    name = getattr(rule, "name", "Generic Detection Rule")
    desc = getattr(rule, "description", "") or f"Detects suspicious activity matching {name}"
    severity = getattr(rule, "severity", "medium").lower()
    tactic = getattr(rule, "mitre_tactic", "")
    technique = getattr(rule, "mitre_technique", "")
    conditions = getattr(rule, "conditions", {}) or {}

    tags = []
    if tactic:
        tags.append(f"attack.{tactic.lower().replace(' ', '_')}")
    if technique:
        tags.append(f"attack.{technique.lower()}")

    # Determine logsource
    event_filter = conditions.get("event_filter", {})
    clean_filter = {str(k): str(v) for k, v in dict(event_filter).items()} if event_filter else {}
    ev_type = clean_filter.get("event_type", "security")
    category = "authentication" if "auth" in ev_type else "network" if "net" in ev_type or "port" in ev_type else "dns" if "dns" in ev_type else "process_creation"

    threshold = conditions.get("threshold", 1)
    window = conditions.get("window_seconds", 60)
    group_by = conditions.get("group_by", "source_ip")

    detection_block: dict[str, Any] = {
        "selection": clean_filter or {"event_type": ev_type},
    }
    if threshold > 1:
        detection_block["condition"] = f"selection | count() > {threshold}"
        detection_block["timeframe"] = f"{window}s"
    else:
        detection_block["condition"] = "selection"

    sigma_dict = {
        "title": name,
        "id": f"sigma-{str(getattr(rule, 'id', 'custom'))[:8]}",
        "status": "production",
        "description": desc,
        "references": [
            f"https://attack.mitre.org/techniques/{technique.replace('.', '/')}" if technique else "https://attack.mitre.org"
        ],
        "author": "SIEM Detection Engineering Team",
        "date": "2026/10/26",
        "tags": tags,
        "logsource": {
            "category": category,
            "product": "linux" if "ssh" in name.lower() or "sudo" in desc.lower() else "network",
        },
        "detection": detection_block,
        "falsepositives": [
            "Administrative maintenance tasks",
            "Internal vulnerability scans",
            "Authorized automated batch jobs",
        ],
        "level": severity if severity in ("low", "medium", "high", "critical") else "medium",
    }

    return yaml.dump(sigma_dict, sort_keys=False, default_flow_style=False)
