import { IconMinus, IconPlus } from "@tabler/icons-react";

type Props = {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
};

export default function SeatStepper({ value, min = 1, max, onChange, label, disabled = false }: Props) {
  return (
    <div className="flex items-center gap-3" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:border-violet-500 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <IconMinus size={18} stroke={2.5} />
      </button>
      <div className="min-w-20 text-center">
        <span className="block text-xl font-black text-slate-900">{value}</span>
        <span className="block text-[11px] font-bold text-slate-500">{label}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition hover:border-violet-500 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <IconPlus size={18} stroke={2.5} />
      </button>
    </div>
  );
}
