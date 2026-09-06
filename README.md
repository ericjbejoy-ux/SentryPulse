# AURA: AI-Driven Adaptive Network Digital Twin

> **Real-time infrastructure resilience engine combining dynamic predictive attack simulation with multi-objective configuration optimization.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack](https://img.shields.io/badge/Stack-FastAPI%20%7C%20React%20Flow%20%7C%20Groq%20%7C%20WebSockets-blue)](#tech-stack)

---

## 🎯 Executive Summary

Enterprise downtime costs over **$5,600 per minute**. Traditional Incident Response tools suffer from two critical flaws:
1. **Reactive Triage:** They alert engineers *after* damage occurs.
2. **Brute-Force Remediation:** Standard fixes (e.g., completely blocking an IP or node) reduce attack risk but cause massive, collateral service disruption for legitimate users.

**AURA** solves this by establishing a continuous **Live Network Digital Twin**. Instead of just detecting incidents, AURA predicts threat vectors, simulates attack progression in a virtual replica, and uses **multi-objective optimization** to apply patches that minimize risk *without* sacrificing performance or availability.

---

## 🔬 Core Innovation: Trade-off Optimization Engine

AURA does not simply choose the safest configuration—it evaluates the **Pareto frontier** across four critical operational vectors:

$$\text{Optimal Config} = \arg\min_{\mathcal{C}} \Big( \alpha \cdot \text{Risk}(\mathcal{C}) + \beta \cdot \text{Disruption}(\mathcal{C}) + \gamma \cdot \text{Latency}(\mathcal{C}) + \delta \cdot \text{Cost}(\mathcal{C}) \Big)$$