---
id: "20251031_Heqing Shi_Variational Auto-Encoder"
type: "session"
kind: "lecture"
status: "held"
date: "2025-10-31"
start: "17:00"
end: "18:00"
venue: "Boardroom, 4th Floor, UEBS"
format: "in-person"
speakers: ["heqing-shi"]
title: "Variational Auto-Encoder (II)"
short: "VAE II"
topic: "ai"
also: ["stat"]
semester: "Autumn 2025"
materials: 
  - {"label": "Notes", "file": "assets/talks/VAE.pdf"}
summary: "Key concepts of the variational auto-encoder and a derivation of its training loss (ELBO), with simple Python use cases."
---

In most cases, we have data, but we do not have the exact knowledge of its underlying distribution. The data with an unknown distribution can be characterized by a set of (low-dimensional) factors, which is usually much lower-dimensional than the data itself. Such a non-parametric dimension reduction technique is quite important for understanding the data dynamics in many problems, e.g. face recognition, drug development, factor investment (those problems face really high-dimensional data). PCA and Auto-encoder are popular for the dimension reduction purpose. However, obtaining a lower-dimensional representation of the data might not be enough. An interesting question is how we can generate the data as "true" as possible given the low-dimensional representation, and that's where Variational Auto-encoder comes to the play.

The session goes through some important concepts in Variational Auto-encoder and derives its training loss (ELBO), with some simple use cases in Python.
