export const RUN_TYPE_STYLES: Record<string, { bg: string; label: string }> = {
  hills: { bg: "bg-green-100 text-green-700", label: "Hills" },
  sprints: { bg: "bg-red-100 text-red-700", label: "Sprints" },
  tempo: { bg: "bg-orange-100 text-orange-700", label: "Tempo" },
  long: { bg: "bg-purple-100 text-purple-700", label: "Long" },
  easy: { bg: "bg-blue-100 text-blue-700", label: "Easy" },
};

interface Props {
  runType: string | null | undefined;
}

export default function RunTypeBadge({ runType }: Props) {
  if (!runType) return null;
  const style = RUN_TYPE_STYLES[runType];
  if (!style) return null;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${style.bg}`}
    >
      {style.label}
    </span>
  );
}
