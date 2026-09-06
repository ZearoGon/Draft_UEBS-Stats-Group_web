---
id: "20251114_Chenyang Guo_Expectation-Maximization Algorithm"
type: "session"
kind: "lecture"
status: "held"
date: "2025-11-14"
start: "17:00"
end: "18:00"
venue: "Boardroom, 4th Floor, UEBS"
format: "in-person"
speakers: ["chenyang-guo"]
title: "Expectation-Maximization Algorithm"
short: "EM Algorithm"
topic: "stat"
also: ["risk"]
semester: "Autumn 2025"
materials: 
  - {"label": "Slides", "file": "assets/talks/EM_Algorithm.pdf"}
summary: "Estimating models with unobserved states: intuition, mathematical foundation, and an application to market regimes with Gaussian mixture models."
---

In many real-world situations, we observe only the outcomes but not the underlying states that generate them. For example, in financial markets, we can observe daily volatility changes but not directly identify which market regime (calm or turbulent) produced them. Identifying which regime generates which data helps capture the distinct risk and volatility patterns associated with each state, thereby potentially improving both risk assessment and forecasting accuracy. However, traditional estimation methods such as Maximum Likelihood struggle in this context because the likelihood function depends on these unobserved states; without knowing the regime labels, we cannot directly compute or maximize it.

The Expectation-Maximization (EM) algorithm offers a principled way to overcome this challenge by iteratively estimating the missing information (E-step) and updating parameters to maximize likelihood (M-step). The session first introduces the intuition through the two-coins example, then formally explains the mathematical foundation of the EM algorithm, and finally demonstrates its application in modeling financial market regimes or sentiment dynamics using Gaussian Mixture Models (GMMs).
