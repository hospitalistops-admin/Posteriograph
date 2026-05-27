---
tags: [paper, bayesian-networks, pediatrics, UTI, validation, clinical-decision-support]
Date: 2022-08-08
authors: [Ramsay JA, Mascaro S, Campbell AJ, Foley DA, Mark AB, Lavu D, Lim K, Coombs E, Hoover M, Kelly G, Boan P, Greenhill A, Korb K, Wu Y, Bowen AC, Snelling TL]
journal: BMC Medical Research Methodology
volume: 22
article: 218
doi: 10.1186/s12874-022-01695-6
pmc: PMC9358867
oa_status: open access (BMC, CC-BY)
group: clinical-grade
---

# Ramsay 2022 — Urinary tract infections in children: building a causal model-based decision support tool with domain knowledge and prospective data

> Ramsay JA et al. **Urinary tract infections in children: building a causal model-based decision support tool for diagnosis with domain knowledge and prospective data.** *BMC Medical Research Methodology.* 2022;22:218.

**DOI:** https://doi.org/10.1186/s12874-022-01695-6
**Direct PDF (BMC):** https://bmcmedresmethodol.biomedcentral.com/track/pdf/10.1186/s12874-022-01695-6
**HTML:** https://bmcmedresmethodol.biomedcentral.com/articles/10.1186/s12874-022-01695-6
**PMC:** https://pmc.ncbi.nlm.nih.gov/articles/PMC9358867/

## Approach

DAG co-developed with clinical domain experts ("Expert DAG") to describe the causal structure of pediatric UTI diagnosis (disease, contamination, and diagnostic processes). Converted into an Applied Bayesian Network. Validated against **prospective data** from 431 episodes of suspected UTI.

## Why it matters for the BN diagnostic app

This is one of the few papers post-Kyrimi-2021 that actually starts to look like the **hybrid-driven, validation-rich, decision-support-focused** BN that field needs. Three things to copy:

1. Co-development with clinical experts — not retrofitting structure to data
2. Prospective data validation, not just internal cross-validation
3. Explicit decision target (interpret culture, guide antibiotic use), not "predict UTI"

Direct precedent for any hyponatremia / sodium DAG you build. See also `[[wu_2023_pediatric_pneumonia_bn]]`.

Design follow-up: `[[ramsay_uti_node_visualization_concepts]]` sketches ways to present the four-state `Causative pathogen` node, local evidence drivers, and sensitivity analysis in a clinician-facing interface.

## Data availability / reuse

The participant-level prospective cohort data does **not** appear to be publicly released in the article or the OSF project. The article's availability statement says that **source models and associated dictionaries** are available via OSF, and the OSF storage contains the Expert DAG, the Applied BN with priors, the learnt Applied BN, and dictionaries.

Publicly reusable pieces:

- Expert DAG source model: https://osf.io/download/vub2p/
- Applied BN with priors: https://osf.io/download/ekc9x/
- Applied BN after cohort learning: https://osf.io/download/ywsj7/
- Expert DAG dictionary: https://osf.io/download/nxc6j/
- Applied BN dictionary: https://osf.io/download/uj2r8/

Implication: for a sociotechnical/presentation-layer prototype, the released **learnt BN** is enough to build a clinician-facing interface that accepts case features and displays posterior shifts, uncertainty, missingness, and scenario branches. For reproducing their cross-validation, recalibrating the model from cases, studying subgroup performance, or simulating clinician workflow on realistic patient episodes, the raw cohort would be needed and would likely require contacting the corresponding author / study team.
