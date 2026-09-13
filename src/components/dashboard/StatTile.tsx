interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  note?: string;
}

export function StatTile({ label, value, unit, note }: StatTileProps) {
  return (
    <div className="card flex flex-col gap-2.5 px-5 py-5">
      <span className="micro text-muted">{label}</span>
      <span className="flex items-baseline gap-2">
        <span className="font-black text-[2.3rem] leading-[1.02] tracking-[-0.03em]">{value}</span>
        {unit && <span className="font-mono text-[0.72rem] text-muted">{unit}</span>}
      </span>
      {note && <span className="font-mono text-[0.66rem] text-muted">{note}</span>}
    </div>
  );
}
