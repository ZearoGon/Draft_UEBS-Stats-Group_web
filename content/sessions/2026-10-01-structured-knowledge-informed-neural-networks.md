---
id: "20261001_Heqing Shi_Structured-Knowledge-Informed Neural Networks"
type: "session"
kind: "lecture"
status: "held"
date: "2026-10-01"
start: "17:00"
end: "18:20"
venue: "Boardroom, 4th Floor, UEBS"
format: "in-person"
note: "First session of Autumn 2026: the paper took the hour, then twenty minutes on how the group runs this year."
speakers: ["heqing-shi"]
discussant: "yifan-qi"
attendees: ["zexun-chen", "heqing-shi", "yifan-qi", "shiqi-fang", "ke-bi", "yizhuo-hu", "chenyang-guo", "yuyang-jiang", "Muhammad Harunurashid Bin Thelatha", "Aws Almusallam", "Yan (Gwen) Song", "han-zhang", "Yufan Sang", "Ruike Ma", "Chenyao Zhang", "Tianyue Wu", "Yihan Si"]
title: "Bridging Structured Knowledge and Data: A Unified Framework with Finance Applications"
short: "SKINNs"
method: "ml"
fields: {"asset": 3, "econ": 2, "risk": 2}
semester: "Autumn 2026"
materials:
  - {"label": "Slides", "file": "assets/talks/20261001_Heqing_Shi_SKINNs.pdf"}
  - {"label": "Paper (SSRN)", "url": "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6503558"}
  - {"label": "Opening: principles, Slack and line-up", "file": "assets/talks/20261001_Opening_Principles_Slack_Line-up.pdf"}
featured: true
summary: "Heqing Shi presented SKINNs, his paper with Yi Cao, Dr Zexun Chen and Lin William Cong: neural networks that estimate economically meaningful structural parameters together with the network, applied to option pricing, portfolios and volatility forecasting. Yifan Qi was discussant."
---

The first session of Autumn 2026 opened the year with AI and machine learning in finance, in the shape of a paper session: one presenter, one discussant, then the room. Heqing Shi presented his paper, written with Yi Cao, Dr Zexun Chen and Lin William Cong, and Yifan Qi served as discussant, explaining the paper for those outside derivatives and putting questions to it.

We develop Structured-Knowledge-Informed Neural Networks (SKINNs), a unified estimation framework that embeds theoretical, simulated, previously learned, or cross-domain insights as differentiable constraints within flexible neural function approximation. SKINNs jointly estimate neural network parameters and economically meaningful structural parameters in a single optimization problem, enforcing theoretical consistency not only on observed data but over a broader input domain through collocation, and therefore nesting approaches such as functional GMM, Bayesian updating, transfer learning, PINNs, and surrogate modeling. SKINNs define a class of M-estimators that are consistent and asymptotically normal with root-N convergence, sandwich covariance, and recovery of pseudo-true parameters under misspecification. In option pricing, SKINNs improve out-of-sample valuation and hedging, particularly at longer horizons and in high-volatility regimes, while recovering interpretable structural parameters with improved stability relative to conventional calibration. The talk also showed applications to asset pricing (implementable portfolios with higher out-of-sample Sharpe ratios) and to realised volatility forecasting.

After the hour, Yifan Qi set out how the group runs this year - its principles, the Slack channel, and the speaker line-up for Semester 1, to be settled by Friday 9 October.
