"""
©AngelaMos | 2026
mitre.py

MITRE ATT&CK Enterprise Matrix Engine

Defines the 14 MITRE Enterprise Tactics and provides coverage mapping
for correlation rules and active alerts across the attack lifecycle.
"""

from typing import Any


MITRE_TACTICS = [
    {"id": "TA0043", "name": "Reconnaissance", "description": "Gathering victim information"},
    {"id": "TA0042", "name": "Resource Development", "description": "Establishing resources for operations"},
    {"id": "TA0001", "name": "Initial Access", "description": "Vectors used to gain entry"},
    {"id": "TA0002", "name": "Execution", "description": "Running malicious code"},
    {"id": "TA0003", "name": "Persistence", "description": "Maintaining foothold"},
    {"id": "TA0004", "name": "Privilege Escalation", "description": "Gaining higher-level permissions"},
    {"id": "TA0005", "name": "Defense Evasion", "description": "Avoiding detection"},
    {"id": "TA0006", "name": "Credential Access", "description": "Stealing account names and passwords"},
    {"id": "TA0007", "name": "Discovery", "description": "Post-compromise environment exploration"},
    {"id": "TA0008", "name": "Lateral Movement", "description": "Moving through network environment"},
    {"id": "TA0009", "name": "Collection", "description": "Gathering target data of interest"},
    {"id": "TA0011", "name": "Command and Control", "description": "Communicating with compromised systems"},
    {"id": "TA0010", "name": "Exfiltration", "description": "Stealing and transferring data"},
    {"id": "TA0040", "name": "Impact", "description": "Manipulating or disrupting systems"},
]

TECHNIQUE_NAMES: dict[str, str] = {
    "T1110": "Brute Force",
    "T1110.001": "Password Guessing",
    "T1046": "Network Service Discovery",
    "T1048.003": "Exfiltration Over Unencrypted Non-C2 Protocol",
    "T1071.004": "DNS Exfiltration Tunneling",
    "T1068": "Exploitation for Privilege Escalation",
    "T1548.003": "Sudo and Sudo Caching",
    "T1053.003": "Cron Persistence",
    "T1059.004": "Unix Shell Execution",
    "T1078": "Valid Accounts",
}


def get_mitre_coverage(rules: list[Any], alerts: list[Any]) -> list[dict[str, Any]]:
    """
    Build a full MITRE ATT&CK Matrix summary mapping tactics, techniques,
    rule coverage count, and triggered alert count.
    """
    matrix: list[dict[str, Any]] = []

    for tactic in MITRE_TACTICS:
        tactic_id = tactic["id"]
        tactic_name = tactic["name"]

        # Find rules matching tactic ID or name
        matching_rules = [
            r for r in rules
            if getattr(r, "mitre_tactic", "") in (tactic_id, tactic_name)
        ]
        # Find alerts matching tactic ID or name
        matching_alerts = [
            a for a in alerts
            if getattr(a, "mitre_tactic", "") in (tactic_id, tactic_name)
        ]

        # Extract unique techniques covered
        covered_techniques: list[dict[str, Any]] = []
        technique_set = set()
        for r in matching_rules:
            tech = getattr(r, "mitre_technique", "")
            if tech and tech not in technique_set:
                technique_set.add(tech)
                covered_techniques.append({
                    "id": tech,
                    "name": TECHNIQUE_NAMES.get(tech, tech),
                    "rule_count": sum(1 for x in matching_rules if getattr(x, "mitre_technique", "") == tech),
                    "alert_count": sum(1 for x in matching_alerts if getattr(x, "mitre_technique", "") == tech),
                })

        matrix.append({
            "tactic_id": tactic_id,
            "tactic_name": tactic_name,
            "description": tactic["description"],
            "rule_count": len(matching_rules),
            "alert_count": len(matching_alerts),
            "covered": len(matching_rules) > 0,
            "techniques": covered_techniques,
        })

    return matrix
