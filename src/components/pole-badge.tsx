export const POLE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  EAPAS: { bg: "#e8f0fb", text: "#2a5ea8", border: "#c9ddf5" },
  Nutrition: { bg: "#fdf1e3", text: "#b8860b", border: "#f0dfc0" },
  "EAPAS+Nutrition": { bg: "#e6f0eb", text: "#0f7a5f", border: "#c7ddd2" },
};

export function PoleBadge({ metier }: { metier: string }) {
  const style = POLE_STYLE[metier] ?? { bg: "#eef1ef", text: "#5b6b64", border: "#e3e8e4" };
  return (
    <span
      className="inline-flex h-[22px] items-center rounded-full px-2.5 text-[11px] font-bold"
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      {metier}
    </span>
  );
}
