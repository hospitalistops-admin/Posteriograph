---
tags: [model-files, bayesian-networks, UTI, visualization]
Date: 2026-05-13
source: OSF 8taqy
status: active
---

# Model files

Downloaded from the Ramsay et al. OSF project: https://osf.io/8taqy/

## Files in this folder

| File | Role | Use for visualization tool |
|---|---|---|
| `Expert_DAG_v11.1.xdsl` | Expert-elicited qualitative DAG in GeNIe/SMILE XML format | Explanatory pathway layer: infection, contamination, management, latent variables, and clinical story. |
| `Expert_DAG_v11.1_dictionary.pdf` | Dictionary for the Expert DAG | Human-readable labels and definitions for the expert pathway map. |
| `Applied_BN_v2.2_priors.dne` | Applied BN before data learning, with expert priors | Compare expert-prior behavior against the learnt model; useful for showing how cohort learning changed predictions. |
| `Applied_BN_v2.2_learnt.dne` | Final Applied BN after learning from the prospective cohort | Main inference layer for the prototype. Parse this for nodes, states, parents, CPTs, and posterior updates. |
| `Applied_BN_v2.2_dictionary.pdf` | Dictionary for the Applied BN | Use to map terse node IDs/states into clinician-facing labels. |

## Initial inspection

- `Applied_BN_v2.2_learnt.dne` is a Netica `.dne` text file.
- It contains 36 BN nodes.
- Main prototype target:
  - node: `CauseUTI`
  - title: `Causative pathogen (b10)`
  - states: `EColi`, `OtherGramNeg`, `GramPos`, `None`

## Recommended next step

Create a parser that converts `Applied_BN_v2.2_learnt.dne` into a simpler JSON representation:

```json
{
  "nodes": [
    {
      "id": "CauseUTI",
      "title": "Causative pathogen (b10)",
      "states": ["EColi", "OtherGramNeg", "GramPos", "None"],
      "parents": ["AgeGroup", "EcoliPresence", "..."],
      "cpt": []
    }
  ]
}
```

Then build the first UI around:

- posterior quartet for `CauseUTI`
- evidence entry controls for common observed nodes
- evidence ledger / ablation view
- local pathway panel using the Expert DAG
- missing or pending test indicators
