# 🛡️ Next-Gen Enterprise SIEM & SOAR Platform
## Minor Project Presentation Slide Deck

**Student Name:** Vidhi Doshi  
**Enrollment No:** 1AUA24BCS904  
**Department:** Computer Science and Engineering (AI-ML)  
**Institution:** Faculty of Engineering Sciences and Technology, Adani University, Ahmedabad  
**Academic Year:** 2026 – 2027 (November 2026)  
**Project GitHub:** [https://github.com/vidhi726/siem](https://github.com/vidhi726/siem)  

---

## 📋 Table of Slides

1. **Title Slide**: Project Introduction & Candidate Credentials
2. **Problem Statement**: Critical Challenges in Modern SOCs
3. **Project Objectives**: Core Technical Aims
4. **System Architecture**: High-Level Multi-Tier System Blueprint
5. **Log Ingestion & Stream Buffer**: Redis Streams Telemetry Pipeline
6. **Correlation Engine**: Multi-Condition Detection Paradigms
7. **Active SOAR Defense**: Bridging Passive SIEM to 1-Click Containment
8. **MITRE ATT&CK® Navigator**: Real-Time Enterprise Kill Chain Mapping
9. **Threat Intelligence & UEBA**: On-Demand Enrichment & Behavioral Scoring
10. **Forensic Integrity**: Cryptographic HMAC-SHA256 Non-Repudiation Seals
11. **Adversary Simulation Engine**: Real-World Attack Scenario Playbooks
12. **Tactical SOC Interface**: Audio Visualizer, 30s Escalation & Localized Time Controls
13. **Comparative Analysis**: Differentiators vs Splunk, Elastic, Sentinel, & Wazuh
14. **Experimental Verification**: Performance Benchmarks & Test Suite Results
15. **Conclusion & Future Enhancements**: Summary and Roadmap
16. **Q&A & Live Demonstration**: System Links & Repository Access

---

### Slide 1: Title Slide
- **Project Title**: Next-Generation Enterprise SIEM & SOAR Platform: Real-Time Threat Correlation, MITRE ATT&CK® Mapping, UEBA, Sigma Rules & Cryptographic Forensics
- **Candidate**: Vidhi Doshi (Enrollment: 1AUA24BCS904)
- **Degree**: Bachelor of Technology in Computer Science and Engineering (AI-ML)
- **Institution**: Adani University, Ahmedabad, Gujarat, India
- **Supervision**: Faculty Mentor, Department of CSE (AI-ML)

---

### Slide 2: Problem Statement & Industry Motivation
- **Exponential Log Explosion**: Enterprises generate millions of log events per hour; legacy RDBMS fail under heavy write loads.
- **High Detection Delays (High MTTD)**: Traditional SIEM tools evaluate batch searches on schedules (3–15 minute delays).
- **Severe Alert Fatigue**: Lack of contextual enrichment and low-contrast UI displays cause analysts to miss critical intrusions.
- **Passive Logging Without Containment**: Conventional SIEMs merely alert. Mitigating attacks requires expensive, separate SOAR licenses.
- **Prohibitive Licensing**: Commercial tools cost $1,200–$2,000/GB/day, forcing organizations to discard valuable security logs.

---

### Slide 3: Project Objectives & Core Scope
- **Sub-Second Streaming Analytics**: Ingest and evaluate thousands of events per second via Redis Streams.
- **Unified 1-Click SOAR**: Direct containment execution (Firewall IP Drop, Host Quarantine, Account Lockout).
- **Tactical Alignment**: Live mapping to the 14 MITRE ATT&CK Enterprise Tactics.
- **Multi-Source Threat Intelligence**: Automated lookups against AbuseIPDB, VirusTotal, AlienVault OTX, and Shodan.
- **Cryptographic Chain of Custody**: HMAC-SHA256 non-repudiation sealing for court-admissible forensic reporting.
- **Ergonomic SOC Cockpit**: React 19 interface with Web Audio synthesizer, FFT visualizer, and 30s escalation watchdog.

---

### Slide 4: High-Level System Architecture
```
[ Log Sources: Windows, Syslog, Firewalls ]
                   │
                   ▼
       [ Redis Streams FIFO Queue ]
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
 [ MongoDB Time-Series ]  [ Correlation Worker Engine ]
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
[ Threat Intel Hub ]    [ Active SOAR ]         [ UEBA Scoring ]
     │                       │                       │
     └───────────────────────┼───────────────────────┘
                             ▼
             [ Flask REST & SSE Streaming API ]
                             │
                             ▼
           [ React 19 Analyst Console (Vite) ]
```

---

### Slide 5: Real-Time Ingestion & Buffer Pipeline
- **Asynchronous Decoupling**: Ingestion never blocks detection; detection never blocks database persistence.
- **Redis Streams (`stream:logs`)**:
  - Handles up to 25,000+ events per second in-memory.
  - Non-blocking consumer group acknowledgments (`XACK`).
  - Circular buffering (`maxlen ~ 100,000`) prevents memory exhaustion.
- **Canonical Schema Normalization**: Standardizes source/dest IPs, ports, usernames, hostnames, and severities via Pydantic v2.

---

### Slide 6: Multi-Paradigm Correlation Engine
The platform evaluates events against sliding temporal windows using three distinct detection paradigms:
1. **Threshold Rules**: Detects rate-based volumetric anomalies (e.g., $>5$ failed logins within 60 seconds).
2. **Sequence Rules**: Detects ordered multi-stage attack steps (e.g., port scan followed by SSH brute force and file modification).
3. **Aggregation Rules**: Identifies statistical group-by deviations (e.g., $>10$ distinct users targeted from a single remote IP).

---

### Slide 7: Active SOAR Containment (Zero-Touch & 1-Click)
- **Passive SIEM $\longrightarrow$ Active Defense**: Enables instant mitigation directly from the alert triage card.
- **Containment Primitives**:
  - **Firewall IP Drop**: Pushes automated perimeter drop rules to block adversary C2 traffic.
  - **Host Network Isolation**: Quarantines compromised endpoints via eBPF/EDR, killing unauthorized sockets while preserving management tunnels.
  - **IAM Credential Revocation**: Invalidates active JWT tokens and triggers immediate OAuth account lockouts.
- **Audit Logging**: All containment actions are cryptographically timestamped and logged.

---

### Slide 8: MITRE ATT&CK® Enterprise Navigator
- **Comprehensive Tactical Coverage**: Real-time interactive matrix overlay spanning all 14 tactical phases:
  - *Reconnaissance $\to$ Initial Access $\to$ Execution $\to$ Persistence $\to$ Privilege Escalation $\to$ Defense Evasion $\to$ Credential Access $\to$ Discovery $\to$ Lateral Movement $\to$ Collection $\to$ Command & Control $\to$ Exfiltration $\to$ Impact*.
- **Visual Matrix Heatmap**: Color-coded cell intensities indicating active threat densities across techniques.
- **1-Click Tactic Filtering**: Analysts can click any technique cell (e.g., `T1110.001 - Password Guessing`) to instantly isolate related alerts.

---

### Slide 9: Threat Intelligence & UEBA Anomaly Scoring
- **Automated Threat Intelligence (TI)**:
  - **AbuseIPDB**: Returns real-time IP confidence-of-abuse percentages.
  - **VirusTotal**: Scans file hashes and IP reputations across 70+ antivirus engines.
  - **AlienVault OTX & Shodan**: Correlates threat pulses and exposed open port telemetry.
- **User & Entity Behavior Analytics (UEBA)**:
  - Computes anomaly scores ($0 - 100$) based on off-hour access, high-volume transfer spikes, and unknown source origins.
  - Identifies kill chain progression across multi-day low-and-slow intrusions.

---

### Slide 10: Cryptographic Forensics & Chain of Custody
- **The Non-Repudiation Problem**: Standard SIEM databases allow insider tampering or unverified record modification.
- **HMAC-SHA256 Digital Sealing**:
  - Every alert generates an immutable HMAC signature over: `Alert ID + Rule ID + Timestamp + Severity + Matched Event IDs`.
  - Stored in the database and displayed on the UI as a verified tamper-evident security badge.
- **1-Click Forensic Case Report**: Exports court-admissible Markdown case dossiers containing verified evidence hashes, full telemetry logs, and containment audit proofs.

---

### Slide 11: Real-World Adversary Simulation Engine
The platform includes built-in multi-stage adversary playbooks to test and validate SOC readiness:
- **Playbook 1: SSH / RDP Brute Force**: Generates rapid authentication failures, triggering threshold rules and credential access alerts.
- **Playbook 2: DNS Tunneling Exfiltration**: Emulates malware querying encoded subdomains for covert C2 data exfiltration.
- **Playbook 3: Phishing Credential Theft**: Simulates malicious link clicks and suspicious token generation.
- **Playbook 4: Linux Sudo Privilege Escalation**: Emulates unauthorized privilege escalation via sudoers manipulation.

---

### Slide 12: Tactical SOC Interface & Analyst Innovations
- **Web Audio Alert Synthesizer**: Zero-latency procedural audio chime for high-severity alerts.
- **Live FFT Audio Visualizer Pill**: Animated frequency visualizer pill indicating real-time sound alarm playback.
- **30-Second Escalation Watchdog**: Automatically re-escalates unacknowledged high-risk alerts with persistent audio chimes.
- **Adaptive Time-Travel Timeline**:
  - Local timezone calibration (`+05:30` / IST) with localized axis and tooltip timestamps.
  - Preset range selectors (`1H`, `6H`, `24H`, `7D`, `30D`).
  - Day navigation stepper (`[ ◀ Prev Day ]`, `[ Today / Live ]`, `[ Next Day ▶ ]`).
- **WCAG 2.1 AA Compliance**: High-contrast dark theme with dual-coded geometric severity symbols (`⬢`, `▲`, `◆`, `●`).

---

### Slide 13: Platform Comparison: Proposed vs Industry

| Capability | Proposed Platform | Splunk Enterprise | Elastic Security | MS Sentinel | Wazuh |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Ingestion Latency** | **Sub-Second (Redis Streams)** | Batch / Scheduled | Logstash Buffer | Agent / Cloud Queue | Daemon Polling |
| **Native SOAR** | **Built-in 1-Click** | Separate (Splunk SOAR) | Basic Connectors | Logic Apps (Paid) | Active Response |
| **MITRE ATT&CK Matrix**| **Interactive Heatmap** | Premium App | Pre-built Matrix | Workbooks | Static Mapping |
| **Sigma Rule Native** | **Bi-Directional YAML** | Requires `sigmac` | Partial EQL | Requires KQL | Requires Translation |
| **Forensic Seals** | **HMAC-SHA256** | Paid Compliance App | Third-Party Hashing | Immutable Blob | Digest Verification |
| **Footprint (RAM)** | **~250 MB Baseline** | 16–32 GB min | 8–16 GB min | Cloud Managed | 4–8 GB |
| **Licensing Cost** | **Open Source (AGPLv3)** | \$1,500+/GB/day | Tiered Subscription| Pay-per-GB | Open Source |

---

### Slide 14: Experimental Benchmarks & Verification
- **Test Suite Pass Rate**: **100%** (8/8 core test suites passed).
- **Rule Evaluation Latency**: $<10\text{ ms}$ under sustained streaming loads.
- **Ingestion Throughput**: Successfully handled 1,000 logs in $<0.5\text{ seconds}$ with 0 dropped packets.
- **Frontend Build Optimization**: Vite compiled production bundle in **5.11 seconds** with 0 errors and $<205\text{ kB}$ gzip payload.
- **Detection Accuracy**: 100% detection rate across all 4 adversary simulation playbooks.

---

### Slide 15: Conclusion & Future Roadmap
- **Conclusion**: Successfully designed and implemented a production-grade, sub-second latency SIEM & SOAR platform that bridges detection with automated defense while ensuring cryptographic non-repudiation.
- **Future Enhancements**:
  1. Deep-learning-based autoencoder neural networks for zero-day behavioral clustering.
  2. Automated graph traversal algorithms for visual attack path reconstruction.
  3. Distributed blockchain anchoring for multi-agency forensic evidence custody.

---

### Slide 16: Q&A & Demonstration
- **GitHub Repository**: [https://github.com/vidhi726/siem](https://github.com/vidhi726/siem)
- **Secondary Mirror**: [https://github.com/vidhi726/siem-dashboard](https://github.com/vidhi726/siem-dashboard)
- **Default Analyst Access**:
  - URL: `http://localhost:5173`
  - Username: `analyst` (or `vidhi`)
  - Password: `Password123!`

*Thank you! Questions and discussions are warmly invited.*
