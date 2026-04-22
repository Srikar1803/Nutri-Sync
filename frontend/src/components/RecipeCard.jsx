export default function RecipeCard({ recipe, index, unavailableIngredients = [] }) {
  if (!recipe) return null;

  const { validation } = recipe;

  const calError     = validation?.errors_vs_claimed?.calories_pct_error ?? 100;
  const matchRate    = (validation?.ingredients_found ?? 0) / (validation?.ingredients_total ?? 1);
  const caloriePassed = calError <= 15;
  const fullyPassed   = caloriePassed && matchRate >= 0.5;

  const badgeClass = fullyPassed || caloriePassed
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-slate-50 text-slate-500 border-slate-200";

  const badgeText = fullyPassed || caloriePassed
    ? "USDA validated"
    : "Nutrition estimated";

  const macroColors = {
    calories:  "text-slate-800",
    protein_g: "text-blue-600",
    carbs_g:   "text-amber-600",
    fat_g:     "text-rose-600",
  };

  const macroLabels = {
    calories:  "Calories",
    protein_g: "Protein",
    carbs_g:   "Carbs",
    fat_g:     "Fat",
  };

  const macroUnits = {
    calories:  "kcal",
    protein_g: "g",
    carbs_g:   "g",
    fat_g:     "g",
  };

  // Check if an ingredient is in the unavailable list
  const isUnavailable = (name) =>
    unavailableIngredients.some(u =>
      name.toLowerCase().includes(u.toLowerCase()) ||
      u.toLowerCase().includes(name.toLowerCase())
    );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {index && (
            <span className="shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white
              text-xs font-bold flex items-center justify-center mt-0.5">
              {index}
            </span>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-900">{recipe.title}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {recipe.prep_time_mins} min prep · {recipe.cook_time_mins} min cook · {recipe.servings} serving
            </p>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border ${badgeClass}`}>
          {badgeText}
        </span>
      </div>

      {/* Selection reason */}
      {recipe.selection_reason && (
        <p className="text-xs text-slate-500 italic border-l-2 border-teal-300 pl-3">
          {recipe.selection_reason}
        </p>
      )}

      {/* Macro comparison */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Macro validation
          </span>
          <span className="text-xs text-slate-400">
            {validation?.ingredients_found}/{validation?.ingredients_total} ingredients matched in USDA
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(macroLabels).map(([key, label]) => {
            const claimed = recipe.claimed_macros?.[key] ?? 0;
            const actual  = validation?.actual_macros?.[key] ?? 0;
            const errKey  = key === "calories" ? "calories_pct_error" : `${key}_pct_error`;
            const err     = validation?.errors_vs_claimed?.[errKey] ?? 0;
            const ok      = err <= 15;

            return (
              <div key={key}
                className={`rounded-xl p-3 border text-center
                  ${ok ? "bg-slate-50 border-slate-100" : "bg-slate-50 border-slate-100"}`}>
                <div className={`text-sm font-bold ${macroColors[key]}`}>
                  {Math.round(claimed)}{macroUnits[key]}
                </div>
                <div className="text-xs text-slate-400">{label}</div>
                <div className="text-xs mt-1 font-medium text-slate-500">
                  ±{err}%
                </div>
                <div className="text-xs text-slate-300">
                  actual: {Math.round(actual)}{macroUnits[key]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Ingredients</h3>
        <div className="space-y-1">
          {recipe.ingredients?.map((ing, i) => {
            const unavail = isUnavailable(ing.name);
            return (
              <div key={i}
                className={`flex items-center justify-between text-sm rounded-lg px-2 py-1
                  ${unavail ? "bg-rose-50 border border-rose-100" : ""}`}>
                <div className="flex items-center gap-2">
                  {unavail && (
                    <span className="text-rose-500 text-xs font-bold shrink-0" title="You marked this as unavailable">
                      ✕
                    </span>
                  )}
                  <span className={`capitalize ${unavail ? "text-rose-600" : "text-slate-700"}`}>
                    {ing.name}
                  </span>
                  {unavail && (
                    <span className="text-xs text-rose-400 italic">not available</span>
                  )}
                </div>
                <span className="text-slate-400 font-mono text-xs">
                  {ing.amount}{ing.unit}
                </span>
              </div>
            );
          })}
        </div>

        {/* Warning if any unavailable ingredients used */}
        {recipe.ingredients?.some(ing => isUnavailable(ing.name)) && (
          <div className="mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-100
            rounded-lg px-3 py-2">
            Some ingredients marked as unavailable appear in this recipe.
            You may substitute or skip them.
          </div>
        )}
      </div>

      {/* Instructions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Instructions</h3>
        <ol className="space-y-2">
          {recipe.instructions?.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-600">
              <span className="shrink-0 w-5 h-5 rounded-full bg-teal-100 text-teal-700
                text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* FAISS info */}
      <div className="text-xs text-slate-300 text-right">
        Generated using {recipe.candidates_retrieved} FAISS reference recipes
      </div>
    </div>
  );
}