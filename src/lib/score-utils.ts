export function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--score-high)';
  if (score >= 40) return 'var(--score-mid)';
  return 'var(--score-low)';
}

export function getScoreLabel(score: number): string {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}
