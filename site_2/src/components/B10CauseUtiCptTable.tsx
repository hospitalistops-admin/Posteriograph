import { learnt } from "../data/models";
import { formatPercent, targetStateLabel } from "../lib/cases";
import { TARGET_STATES, causeUtiCptTable, type TargetState } from "../lib/b10Views";
import type { EvidenceSet } from "../types";
import { B10_EXPLANATIONS, B10InfoTip } from "./B10InfoTip";

export function B10CauseUtiCptTable({ evidence }: { evidence: EvidenceSet }) {
  const rows = causeUtiCptTable(learnt, evidence);
  const exact = rows.find((row) => row.exactParentMatch);

  return (
    <div className="b10-cpt-table-wrap">
      <header className="b10-cpt-table-head">
        <h3>CauseUTI CPT (learnt model)</h3>
        <B10InfoTip
          label="About this table"
          source="learnt"
          summary={B10_EXPLANATIONS.cptEffectiveCases.summary}
        >
          <p>
            Rows are parent assignments for <code>CauseUTI</code> from{" "}
            <strong>Applied_BN_v2.2_learnt.dne</strong>. Probabilities are the learnt CPT; effective cases are{" "}
            <code>numcases</code> from Netica (fractional weights after parameter learning, cohort N≈441 overall).
          </p>
          {exact ? (
            <p>
              <strong>Current patient row:</strong> {exact.parentLabel} — effective cases{" "}
              {exact.effectiveCases?.toFixed(2) ?? "—"}
            </p>
          ) : (
            <p>Not all parent states are observed — highlighted rows match partial evidence.</p>
          )}
        </B10InfoTip>
      </header>
      <div className="b10-cpt-scroll">
        <table className="b10-cpt-table">
          <thead>
            <tr>
              <th>Parent assignment</th>
              {TARGET_STATES.map((state) => (
                <th key={state}>{targetStateLabel(state)}</th>
              ))}
              <th title={B10_EXPLANATIONS.cptEffectiveCases.summary}>Eff. cases</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.parentLabel}
                className={
                  row.exactParentMatch
                    ? "cpt-row exact"
                    : row.matchesEvidence
                      ? "cpt-row partial"
                      : "cpt-row"
                }
              >
                <td title={row.parentLabel}>{row.parentLabel}</td>
                {TARGET_STATES.map((state) => (
                  <td key={state}>{formatPercent(row.probabilities[state as TargetState] ?? 0, 1)}</td>
                ))}
                <td>{row.effectiveCases != null ? row.effectiveCases.toFixed(1) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
