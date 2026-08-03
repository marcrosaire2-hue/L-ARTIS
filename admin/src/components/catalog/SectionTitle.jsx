export default function SectionTitle({ title, count }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
      {count != null && <p className="text-sm text-slate-500">{count}</p>}
    </div>
  );
}
