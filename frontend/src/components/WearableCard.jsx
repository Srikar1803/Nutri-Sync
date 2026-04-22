export default function WearableCard({ profile }) {
  if (!profile) return null;

  const score = profile.recovery_score;
  const scoreColor =
    score >= 0.75 ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : score >= 0.50 ? "text-amber-600 bg-amber-50 border-amber-200"
    : "text-red-600 bg-red-50 border-red-200";
  const scoreLabel =
    score >= 0.75 ? "Good recovery"
    : score >= 0.50 ? "Fair recovery"
    : "Low recovery";

  const metrics = [
    { label: "Daily TDEE",     value: `${profile.tdee_kcal.toLocaleString()} kcal` },
    { label: "Meal target",    value: `${profile.meal_target_kcal.toLocaleString()} kcal` },
    { label: "Sleep",          value: `${profile.sleep_hours} hrs` },
    { label: "Steps",          value: profile.steps ? profile.steps.toLocaleString() : "—" },
    { label: "Data source",    value: profile.data_source },
    { label: "NHANES fraction",value: `${(profile.nhanes_fraction_used * 100).toFixed(0)}% of TDEE` },
  ];

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-4">

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Wearable snapshot</span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${scoreColor}`}>
          {scoreLabel} ({(score * 100).toFixed(0)}%)
        </span>
      </div>

      {/* Recovery bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Recovery score</span>
          <span>{(score * 100).toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700
              ${score >= 0.75 ? "bg-emerald-500" : score >= 0.50 ? "bg-amber-400" : "bg-red-400"}`}
            style={{ width: `${score * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-white rounded-xl px-3 py-2.5 border border-slate-100"
          >
            <div className="text-xs text-slate-400 mb-0.5">{m.label}</div>
            <div className="text-sm font-semibold text-slate-800 capitalize">{m.value}</div>
          </div>
        ))}
      </div>

      {profile.notes?.length > 0 && (
        <div className="space-y-1">
          {profile.notes.map((note, i) => (
            <div
              key={i}
              className="text-xs text-slate-600 bg-white border border-slate-100
                rounded-lg px-3 py-2 flex items-start gap-2"
            >
              <span className="text-teal-500 mt-0.5 shrink-0">•</span>
              {note}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
