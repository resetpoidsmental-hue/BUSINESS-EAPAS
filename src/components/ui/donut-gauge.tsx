interface DonutGaugeProps {
  /** 0-100, ignoré si checkmark est vrai. */
  percent: number;
  size?: number;
  strokeWidth?: number;
  /** Affiche une coche verte plutôt qu'un pourcentage (ex: objectif marqué atteint). */
  checkmark?: boolean;
}

export function DonutGauge({ percent, size = 96, strokeWidth = 12, checkmark = false }: DonutGaugeProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = checkmark ? c : (clamped / 100) * c;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={checkmark ? "var(--color-success-soft)" : "var(--color-border)"}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={checkmark ? "var(--color-success)" : "var(--color-primary)"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform={`rotate(-90 ${center} ${center})`}
      />
      {checkmark ? (
        <path
          d={`M${center - 14} ${center + 1} l10 10 l20 -22`}
          fill="none"
          stroke="var(--color-success)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <text
          x={center}
          y={center + size * 0.07}
          textAnchor="middle"
          fontSize={size * 0.24}
          fontWeight={700}
          fill="var(--color-foreground)"
        >
          {Math.round(clamped)}%
        </text>
      )}
    </svg>
  );
}
