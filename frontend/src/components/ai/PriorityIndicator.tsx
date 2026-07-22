import type { PriorityLevel } from "../../types";
import styles from "./PriorityIndicator.module.css";

const LABELS: Record<PriorityLevel, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

/**
 * Visualizes the AI priority score computed by
 * backend/app/services/ai/prioritization.py. Currently a keyword heuristic;
 * replace the backend service with a real model and this stays as-is.
 */
export function PriorityIndicator({ priority }: { priority: PriorityLevel | null }) {
  if (!priority) return null;
  return <span className={`${styles.indicator} ${styles[priority]}`}>{LABELS[priority]}</span>;
}
