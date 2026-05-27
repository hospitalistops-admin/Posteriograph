# CPT extract: b1, b10, b23, b24, b25

Source: `Applied_BN_v2.2_learnt.dne`, parsed into `site/src/data/model.generated.json`.

Rows are ordered by the node parent order shown under each heading. Each row gives `P(node state | parent assignment)`.

## b1: Age (b1) / `AgeGroup`

States: `LessThan6Mon`, `Btw6MonAnd2Yr`, `Btw2And5Yr`, `Above5Yr`

Parents: _none_

| P(LessThan6Mon) | P(Btw6MonAnd2Yr) | P(Btw2And5Yr) | P(Above5Yr) |
| --- | --- | --- | --- |
| 18.027% | 23.696% | 22.562% | 35.714% |

## b10: Causative pathogen (b10) / `CauseUTI`

States: `EColi`, `OtherGramNeg`, `GramPos`, `None`

Parents: `PrevUriKidProbs` -> `AgeGroup` -> `EcoliPresence` -> `OtherGramNegPresence` -> `GramPosPresence`

| PrevUriKidProbs | AgeGroup | EcoliPresence | OtherGramNegPresence | GramPosPresence | P(EColi) | P(OtherGramNeg) | P(GramPos) | P(None) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Reported | LessThan6Mon | High | High | High | 34.991% | 25.019% | 22.209% | 17.781% |
| Reported | LessThan6Mon | High | High | Low | 41.896% | 38.881% | 0.001% | 19.222% |
| Reported | LessThan6Mon | High | Low | High | 36.382% | 0.000% | 51.772% | 11.846% |
| Reported | LessThan6Mon | High | Low | Low | 84.304% | 0.001% | 0.001% | 15.695% |
| Reported | LessThan6Mon | Low | High | High | 0.001% | 44.064% | 34.214% | 21.720% |
| Reported | LessThan6Mon | Low | High | Low | 0.000% | 77.990% | 0.000% | 22.010% |
| Reported | LessThan6Mon | Low | Low | High | 0.000% | 0.000% | 79.826% | 20.174% |
| Reported | LessThan6Mon | Low | Low | Low | 0.001% | 0.001% | 0.001% | 99.996% |
| Reported | Btw6MonAnd2Yr | High | High | High | 31.102% | 27.428% | 18.792% | 22.679% |
| Reported | Btw6MonAnd2Yr | High | High | Low | 42.469% | 35.669% | 0.001% | 21.860% |
| Reported | Btw6MonAnd2Yr | High | Low | High | 53.627% | 0.001% | 31.220% | 15.153% |
| Reported | Btw6MonAnd2Yr | High | Low | Low | 87.876% | 0.000% | 0.000% | 12.123% |
| Reported | Btw6MonAnd2Yr | Low | High | High | 0.001% | 44.237% | 31.712% | 24.050% |
| Reported | Btw6MonAnd2Yr | Low | High | Low | 0.000% | 75.789% | 0.000% | 24.211% |
| Reported | Btw6MonAnd2Yr | Low | Low | High | 0.000% | 0.000% | 75.224% | 24.775% |
| Reported | Btw6MonAnd2Yr | Low | Low | Low | 0.000% | 0.000% | 0.000% | 100.000% |
| Reported | Btw2And5Yr | High | High | High | 33.024% | 29.980% | 26.205% | 10.792% |
| Reported | Btw2And5Yr | High | High | Low | 46.663% | 41.896% | 0.001% | 11.440% |
| Reported | Btw2And5Yr | High | Low | High | 45.903% | 0.000% | 48.013% | 6.084% |
| Reported | Btw2And5Yr | High | Low | Low | 92.509% | 0.000% | 0.000% | 7.491% |
| Reported | Btw2And5Yr | Low | High | High | 0.001% | 47.444% | 41.322% | 11.233% |
| Reported | Btw2And5Yr | Low | High | Low | 0.001% | 87.384% | 0.000% | 12.614% |
| Reported | Btw2And5Yr | Low | Low | High | 0.001% | 0.000% | 92.578% | 7.421% |
| Reported | Btw2And5Yr | Low | Low | Low | 0.001% | 0.001% | 0.001% | 99.997% |
| Reported | Above5Yr | High | High | High | 32.362% | 36.204% | 27.405% | 4.029% |
| Reported | Above5Yr | High | High | Low | 44.782% | 51.049% | 0.000% | 4.169% |
| Reported | Above5Yr | High | Low | High | 51.179% | 0.000% | 45.508% | 3.313% |
| Reported | Above5Yr | High | Low | Low | 84.246% | 0.000% | 0.000% | 15.754% |
| Reported | Above5Yr | Low | High | High | 0.001% | 53.567% | 42.655% | 3.777% |
| Reported | Above5Yr | Low | High | Low | 0.001% | 96.065% | 0.001% | 3.933% |
| Reported | Above5Yr | Low | Low | High | 0.000% | 0.000% | 97.033% | 2.966% |
| Reported | Above5Yr | Low | Low | Low | 0.001% | 0.001% | 0.001% | 99.998% |
| Unknown | LessThan6Mon | High | High | High | 19.434% | 16.514% | 11.996% | 52.057% |
| Unknown | LessThan6Mon | High | High | Low | 28.882% | 20.312% | 0.001% | 50.805% |
| Unknown | LessThan6Mon | High | Low | High | 43.617% | 0.000% | 26.719% | 29.663% |
| Unknown | LessThan6Mon | High | Low | Low | 80.677% | 0.000% | 0.000% | 19.323% |
| Unknown | LessThan6Mon | Low | High | High | 0.001% | 26.533% | 19.477% | 53.989% |
| Unknown | LessThan6Mon | Low | High | Low | 0.000% | 45.520% | 0.000% | 54.480% |
| Unknown | LessThan6Mon | Low | Low | High | 0.001% | 0.001% | 51.741% | 48.257% |
| Unknown | LessThan6Mon | Low | Low | Low | 0.001% | 0.000% | 0.001% | 99.997% |
| Unknown | Btw6MonAnd2Yr | High | High | High | 20.401% | 15.753% | 13.856% | 49.989% |
| Unknown | Btw6MonAnd2Yr | High | High | Low | 32.929% | 18.586% | 0.001% | 48.484% |
| Unknown | Btw6MonAnd2Yr | High | Low | High | 57.454% | 0.000% | 13.126% | 29.419% |
| Unknown | Btw6MonAnd2Yr | High | Low | Low | 80.364% | 0.000% | 0.000% | 19.636% |
| Unknown | Btw6MonAnd2Yr | Low | High | High | 0.001% | 25.061% | 19.536% | 55.402% |
| Unknown | Btw6MonAnd2Yr | Low | High | Low | 0.000% | 43.900% | 0.000% | 56.100% |
| Unknown | Btw6MonAnd2Yr | Low | Low | High | 0.001% | 0.001% | 50.864% | 49.134% |
| Unknown | Btw6MonAnd2Yr | Low | Low | Low | 0.001% | 0.000% | 0.001% | 99.997% |
| Unknown | Btw2And5Yr | High | High | High | 20.083% | 19.931% | 16.237% | 43.749% |
| Unknown | Btw2And5Yr | High | High | Low | 30.027% | 27.146% | 0.000% | 42.826% |
| Unknown | Btw2And5Yr | High | Low | High | 34.973% | 0.000% | 39.618% | 25.408% |
| Unknown | Btw2And5Yr | High | Low | Low | 75.377% | 0.000% | 0.000% | 24.623% |
| Unknown | Btw2And5Yr | Low | High | High | 0.001% | 30.124% | 23.635% | 46.240% |
| Unknown | Btw2And5Yr | Low | High | Low | 0.001% | 52.865% | 0.000% | 47.134% |
| Unknown | Btw2And5Yr | Low | Low | High | 0.000% | 0.000% | 67.838% | 32.161% |
| Unknown | Btw2And5Yr | Low | Low | Low | 0.001% | 0.000% | 0.001% | 99.998% |
| Unknown | Above5Yr | High | High | High | 19.712% | 21.139% | 18.131% | 41.018% |
| Unknown | Above5Yr | High | High | Low | 29.598% | 29.826% | 0.000% | 40.576% |
| Unknown | Above5Yr | High | Low | High | 25.618% | 0.000% | 48.790% | 25.591% |
| Unknown | Above5Yr | High | Low | Low | 71.583% | 0.000% | 0.000% | 28.417% |
| Unknown | Above5Yr | Low | High | High | 0.001% | 30.271% | 28.693% | 41.035% |
| Unknown | Above5Yr | Low | High | Low | 0.001% | 55.462% | 0.001% | 44.536% |
| Unknown | Above5Yr | Low | Low | High | 0.001% | 0.000% | 68.742% | 31.257% |
| Unknown | Above5Yr | Low | Low | Low | 0.001% | 0.000% | 0.001% | 99.998% |

## b23: Blood - CRP level (b23) / `CRPLevel`

States: `Above70`, `Btw15And70`, `Below15`, `NotDone`

Parents: `CauseUTI` -> `AgeGroup`

| CauseUTI | AgeGroup | P(Above70) | P(Btw15And70) | P(Below15) | P(NotDone) |
| --- | --- | --- | --- | --- | --- |
| EColi | LessThan6Mon | 29.263% | 26.987% | 12.391% | 31.360% |
| EColi | Btw6MonAnd2Yr | 11.280% | 12.604% | 3.669% | 72.446% |
| EColi | Btw2And5Yr | 7.219% | 7.029% | 1.811% | 83.940% |
| EColi | Above5Yr | 11.382% | 8.311% | 3.924% | 76.383% |
| OtherGramNeg | LessThan6Mon | 20.705% | 19.561% | 19.432% | 40.302% |
| OtherGramNeg | Btw6MonAnd2Yr | 27.263% | 18.841% | 18.441% | 35.455% |
| OtherGramNeg | Btw2And5Yr | 8.352% | 8.585% | 8.290% | 74.772% |
| OtherGramNeg | Above5Yr | 22.335% | 19.821% | 15.809% | 42.035% |
| GramPos | LessThan6Mon | 11.123% | 18.216% | 24.806% | 45.855% |
| GramPos | Btw6MonAnd2Yr | 14.564% | 13.737% | 13.708% | 57.990% |
| GramPos | Btw2And5Yr | 2.592% | 5.364% | 5.124% | 86.920% |
| GramPos | Above5Yr | 2.446% | 5.744% | 11.807% | 80.003% |
| None | LessThan6Mon | 0.480% | 0.494% | 15.812% | 83.214% |
| None | Btw6MonAnd2Yr | 2.847% | 5.827% | 9.134% | 82.192% |
| None | Btw2And5Yr | 0.345% | 0.365% | 9.697% | 89.594% |
| None | Above5Yr | 3.362% | 1.815% | 1.388% | 93.434% |

## b24: Blood - WBC level (b24) / `WCCLevel`

States: `Above18`, `Btw10And18`, `Below10`, `NotDone`

Parents: `CauseUTI` -> `AgeGroup`

| CauseUTI | AgeGroup | P(Above18) | P(Btw10And18) | P(Below10) | P(NotDone) |
| --- | --- | --- | --- | --- | --- |
| EColi | LessThan6Mon | 20.608% | 36.722% | 10.330% | 32.339% |
| EColi | Btw6MonAnd2Yr | 11.411% | 11.296% | 5.009% | 72.285% |
| EColi | Btw2And5Yr | 9.000% | 5.233% | 1.917% | 83.850% |
| EColi | Above5Yr | 9.461% | 10.735% | 4.136% | 75.668% |
| OtherGramNeg | LessThan6Mon | 17.762% | 27.714% | 17.537% | 36.987% |
| OtherGramNeg | Btw6MonAnd2Yr | 17.410% | 25.936% | 22.645% | 34.010% |
| OtherGramNeg | Btw2And5Yr | 8.414% | 8.540% | 8.352% | 74.694% |
| OtherGramNeg | Above5Yr | 6.241% | 35.248% | 16.266% | 42.246% |
| GramPos | LessThan6Mon | 8.561% | 40.109% | 8.482% | 42.848% |
| GramPos | Btw6MonAnd2Yr | 13.281% | 14.182% | 22.541% | 49.996% |
| GramPos | Btw2And5Yr | 2.595% | 7.888% | 2.645% | 86.872% |
| GramPos | Above5Yr | 2.781% | 5.322% | 11.892% | 80.005% |
| None | LessThan6Mon | 0.419% | 8.914% | 17.994% | 72.673% |
| None | Btw6MonAnd2Yr | 0.272% | 5.477% | 14.195% | 80.056% |
| None | Btw2And5Yr | 0.324% | 3.625% | 8.743% | 87.309% |
| None | Above5Yr | 0.164% | 2.336% | 7.150% | 90.350% |

## b25: Blood - ANC level (b25) / `NeutLevel`

States: `Above15`, `Btw8And15`, `Below8`, `NotDone`

Parents: `WCCLevel` -> `CauseUTI` -> `AgeGroup`

| WCCLevel | CauseUTI | AgeGroup | P(Above15) | P(Btw8And15) | P(Below8) | P(NotDone) |
| --- | --- | --- | --- | --- | --- | --- |
| Above18 | EColi | LessThan6Mon | 38.663% | 59.467% | 1.824% | 0.046% |
| Above18 | EColi | Btw6MonAnd2Yr | 53.599% | 43.365% | 2.963% | 0.074% |
| Above18 | EColi | Btw2And5Yr | 86.976% | 7.156% | 5.725% | 0.143% |
| Above18 | EColi | Above5Yr | 69.653% | 25.944% | 4.295% | 0.108% |
| Above18 | OtherGramNeg | LessThan6Mon | 9.030% | 50.118% | 39.854% | 0.997% |
| Above18 | OtherGramNeg | Btw6MonAnd2Yr | 9.448% | 49.976% | 39.586% | 0.991% |
| Above18 | OtherGramNeg | Btw2And5Yr | 9.204% | 49.887% | 39.910% | 0.999% |
| Above18 | OtherGramNeg | Above5Yr | 4.548% | 75.370% | 19.592% | 0.490% |
| Above18 | GramPos | LessThan6Mon | 9.012% | 50.133% | 39.857% | 0.997% |
| Above18 | GramPos | Btw6MonAnd2Yr | 9.102% | 49.972% | 39.926% | 0.999% |
| Above18 | GramPos | Btw2And5Yr | 9.031% | 49.982% | 39.986% | 1.001% |
| Above18 | GramPos | Above5Yr | 8.778% | 51.296% | 38.952% | 0.975% |
| Above18 | None | LessThan6Mon | 9.001% | 49.999% | 39.999% | 1.001% |
| Above18 | None | Btw6MonAnd2Yr | 9.006% | 49.996% | 39.997% | 1.001% |
| Above18 | None | Btw2And5Yr | 9.001% | 49.999% | 39.999% | 1.001% |
| Above18 | None | Above5Yr | 9.001% | 49.999% | 39.999% | 1.001% |
| Btw10And18 | EColi | LessThan6Mon | 0.151% | 16.199% | 83.633% | 0.017% |
| Btw10And18 | EColi | Btw6MonAnd2Yr | 0.662% | 69.556% | 29.708% | 0.074% |
| Btw10And18 | EColi | Btw2And5Yr | 3.750% | 79.150% | 16.683% | 0.417% |
| Btw10And18 | EColi | Above5Yr | 0.773% | 82.115% | 17.027% | 0.085% |
| Btw10And18 | OtherGramNeg | LessThan6Mon | 1.230% | 6.863% | 91.770% | 0.137% |
| Btw10And18 | OtherGramNeg | Btw6MonAnd2Yr | 4.253% | 24.463% | 70.811% | 0.473% |
| Btw10And18 | OtherGramNeg | Btw2And5Yr | 2.254% | 62.515% | 34.981% | 0.251% |
| Btw10And18 | OtherGramNeg | Above5Yr | 27.539% | 68.842% | 3.547% | 0.072% |
| Btw10And18 | GramPos | LessThan6Mon | 0.841% | 19.562% | 79.504% | 0.094% |
| Btw10And18 | GramPos | Btw6MonAnd2Yr | 2.955% | 16.561% | 80.155% | 0.329% |
| Btw10And18 | GramPos | Btw2And5Yr | 7.450% | 50.148% | 41.573% | 0.829% |
| Btw10And18 | GramPos | Above5Yr | 7.902% | 55.941% | 35.283% | 0.874% |
| Btw10And18 | None | LessThan6Mon | 3.326% | 41.582% | 54.260% | 0.832% |
| Btw10And18 | None | Btw6MonAnd2Yr | 3.356% | 41.983% | 53.821% | 0.840% |
| Btw10And18 | None | Btw2And5Yr | 1.815% | 77.262% | 20.469% | 0.454% |
| Btw10And18 | None | Above5Yr | 1.792% | 77.875% | 19.891% | 0.443% |
| Below10 | EColi | LessThan6Mon | 0.000% | 5.842% | 94.038% | 0.119% |
| Below10 | EColi | Btw6MonAnd2Yr | 0.000% | 13.669% | 86.051% | 0.279% |
| Below10 | EColi | Btw2And5Yr | 0.001% | 24.819% | 74.674% | 0.507% |
| Below10 | EColi | Above5Yr | 0.000% | 13.636% | 86.085% | 0.279% |
| Below10 | OtherGramNeg | LessThan6Mon | 0.001% | 48.968% | 50.030% | 1.000% |
| Below10 | OtherGramNeg | Btw6MonAnd2Yr | 0.000% | 15.280% | 84.408% | 0.312% |
| Below10 | OtherGramNeg | Btw2And5Yr | 0.001% | 48.723% | 50.281% | 0.995% |
| Below10 | OtherGramNeg | Above5Yr | 0.000% | 4.496% | 95.411% | 0.092% |
| Below10 | GramPos | LessThan6Mon | 0.001% | 48.864% | 50.137% | 0.998% |
| Below10 | GramPos | Btw6MonAnd2Yr | 0.001% | 42.886% | 56.237% | 0.876% |
| Below10 | GramPos | Btw2And5Yr | 0.001% | 48.889% | 50.111% | 0.999% |
| Below10 | GramPos | Above5Yr | 0.001% | 36.365% | 62.891% | 0.743% |
| Below10 | None | LessThan6Mon | 0.001% | 1.667% | 97.915% | 0.417% |
| Below10 | None | Btw6MonAnd2Yr | 0.000% | 0.773% | 99.033% | 0.193% |
| Below10 | None | Btw2And5Yr | 0.001% | 3.552% | 95.559% | 0.889% |
| Below10 | None | Above5Yr | 0.000% | 1.475% | 98.156% | 0.369% |
| NotDone | EColi | LessThan6Mon | 0.002% | 0.002% | 0.002% | 99.994% |
| NotDone | EColi | Btw6MonAnd2Yr | 0.000% | 0.000% | 0.000% | 99.999% |
| NotDone | EColi | Btw2And5Yr | 0.000% | 0.000% | 0.000% | 99.999% |
| NotDone | EColi | Above5Yr | 0.000% | 0.000% | 0.000% | 99.999% |
| NotDone | OtherGramNeg | LessThan6Mon | 0.099% | 0.099% | 0.099% | 99.704% |
| NotDone | OtherGramNeg | Btw6MonAnd2Yr | 0.009% | 0.009% | 0.009% | 99.972% |
| NotDone | OtherGramNeg | Btw2And5Yr | 0.005% | 0.005% | 0.005% | 99.985% |
| NotDone | OtherGramNeg | Above5Yr | 0.033% | 0.033% | 0.033% | 99.902% |
| NotDone | GramPos | LessThan6Mon | 0.008% | 0.008% | 0.008% | 99.976% |
| NotDone | GramPos | Btw6MonAnd2Yr | 0.005% | 0.005% | 0.005% | 99.984% |
| NotDone | GramPos | Btw2And5Yr | 0.001% | 0.001% | 0.001% | 99.996% |
| NotDone | GramPos | Above5Yr | 0.001% | 0.001% | 0.001% | 99.996% |
| NotDone | None | LessThan6Mon | 0.009% | 0.009% | 0.009% | 99.974% |
| NotDone | None | Btw6MonAnd2Yr | 0.031% | 0.031% | 0.031% | 99.906% |
| NotDone | None | Btw2And5Yr | 0.006% | 0.006% | 0.006% | 99.982% |
| NotDone | None | Above5Yr | 0.001% | 0.001% | 0.001% | 99.998% |

