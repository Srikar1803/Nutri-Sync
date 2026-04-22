export default function MacroDisplay({ profile, queryString }) {
  if (!profile) return null;

  const macros = [
    {
      label: "Protein",
      value: profile.protein_target_g,
      pct: profile.protein_pct,
      unit: "g",
      bar: "bg-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
    },
    {
      label: "Carbs",
      value: profile.carbs_target_g,
      pct: profile.carbs_pct,
      unit: "g",
      bar: "bg-amber-400",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
    },
    {
      label: "Fat",
      value: profile.fat_target_g,
      pct: profile.fat_pct,
      unit: "g",
      bar: "bg-rose-400",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-100",
    },
  ];

  const goalLabel = {
    weight_loss: "Weight loss",
    maintenance: "Maintenance",
    muscle_gain: "Muscle gain",
  }[profile.goal] || profile.goal;

  const mealLabel = {
    breakfast: "Breakfast",
    lunch:     "Lunch",
    dinner:    "Dinner",
    snack:     "Snack",
  }[profile.meal_time] || profile.meal_time;

  return (
    <div className="space-y-5">

      {/* Caloric headline */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-900 tabular-nums">
              {Math.round(profile.meal_target_kcal).toLocaleString()}
            </span>
            <span className="text-lg text-slate-400 font-medium">kcal</span>
          </div>
          <div className="text-sm text-slate-400 mt-0.5">
            {mealLabel} · TDEE {profile.tdee_kcal.toLocaleString()} kcal/day
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 mb-0.5">Goal</div>
          <span className="text-sm font-semibold text-teal-700 bg-teal-50
            border border-teal-200 px-2.5 py-1 rounded-full">
            {goalLabel}
          </span>
        </div>
      </div>

      {/* Stacked macro bar */}
      <div className="space-y-1.5">
        <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
          {macros.map((m) => (
            <div
              key={m.label}
              className={`${m.bar} transition-all duration-700`}
              style={{ width: `${m.pct}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          {macros.map((m) => (
            <span key={m.label}>{m.label} {m.pct}%</span>
          ))}
        </div>
      </div>

      {/* Macro cards */}
      <div className="grid grid-cols-3 gap-2">
        {macros.map((m) => (
          <div
            key={m.label}
            className={`${m.bg} ${m.border} border rounded-xl px-3 py-3 text-center`}
          >
            <div className={`text-2xl font-bold ${m.text} tabular-nums`}>
              {m.value}
              <span className="text-sm font-normal ml-0.5">{m.unit}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      {/* FAISS query preview */}
      {queryString && (
        <div className="bg-slate-900 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              FAISS retrieval query
            </span>
          </div>
          <p className="text-xs text-slate-300 font-mono leading-relaxed break-words">
            {queryString}
          </p>
        </div>
      )}
    </div>
  );
}
