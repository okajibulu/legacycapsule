interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
  alert?: boolean
}

export default function StatCard({
  label,
  value,
  sub,
  highlight,
  alert,
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 space-y-1 transition-all duration-150
        ${
          alert
            ? 'border-red-400/30 bg-red-400/5'
            : highlight
            ? 'border-yellow-400/30 bg-yellow-400/8'
            : 'border-white/10 bg-white/4'
        }`}
    >
      <p className="text-[10px] text-white/40 uppercase tracking-widest">
        {label}
      </p>
      <p
        className={`text-2xl font-bold ${
          alert
            ? 'text-red-300'
            : highlight
            ? 'text-yellow-300'
            : 'text-white'
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-white/30">{sub}</p>}
    </div>
  )
}
