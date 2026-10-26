---
id: "20261016_Yifan Qi_Estimation Method_AMCE & PPML"
type: "session"
kind: "lecture"
status: "held"
date: "2026-10-16"
start: "17:00"
end: "18:00"
venue: "Boardroom, 4th Floor, UEBS"
format: "in-person"
speakers: ["yifan-qi"]
title: "Estimation Methods: AMCE and PPML - which estimator, when, and how?"
short: "AMCE & PPML"
method: "estimation"
fields: {"econ": 3}
semester: "Autumn 2026"
materials:
  - {"label": "Interactive slides", "file": "assets/slides/20261016-amce-ppml/index.html"}
featured: true
cover: "assets/covers/20261016-amce-ppml.jpg"
cover_alt: "Yifan Qi presenting the AMCE and PPML session in the Boardroom, 16 October 2026"
summary: "Three questions to ask of any empirical paper: which number you want (a difference, the AMCE, or a ratio, estimated by PPML), why it is causal, and what the data look like - from OLS and GLS to logit and PPML."
---

The whole talk comes down to three questions you can ask of any empirical paper, in this order.

1. **Which number do you want?** A difference - the average marginal component effect (AMCE), usually estimated by OLS - or a ratio - the risk ratio, usually estimated by Poisson pseudo-maximum likelihood (PPML).
2. **Why is it causal?** The key is assumption A5, E(ε | X) = 0. Randomisation secures it by design; observational data argue for it with controls, fixed effects, difference-in-differences or instruments.
3. **What do the data look like?** Continuous outcomes: OLS. Repeated, correlated answers: GLS. 0/1 outcomes: OLS or logit. Non-negative with many zeros: PPML.

One made-up example carries all five estimators, and underneath they all solve the same equation; changing the estimator changes what you assume. The interactive slides include the full derivations, among them the definition of the classical linear model (CLM) added after Dr Zexun Chen raised it in the room. For Stata, Han Zhang recommended `margins, dydx(...)` after the regression: it averages over the sample distribution of the other attributes and gives the AMCE directly.
