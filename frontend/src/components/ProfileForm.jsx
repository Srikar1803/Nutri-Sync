import { useState } from "react";

const ACTIVITY_OPTIONS = [
  { value: "sedentary",   label: "Sedentary",   sub: "desk job, no exercise" },
  { value: "light",       label: "Light",       sub: "1–3 days/week" },
  { value: "moderate",    label: "Moderate",    sub: "3–5 days/week" },
  { value: "active",      label: "Active",      sub: "6–7 days/week" },
  { value: "very_active", label: "Very active", sub: "physical job + daily exercise" },
];

const WEEKLY_GOAL_OPTIONS = {
  weight_loss:  [
    { value: 0.25, label: "0.25 kg/week (mild)" },
    { value: 0.5,  label: "0.5 kg/week (moderate)" },
    { value: 1.0,  label: "1 kg/week (aggressive)" },
    { value: 1.5,  label: "1.5 kg/week (very aggressive)" },
  ],
  muscle_gain: [
    { value: 0.25, label: "0.25 kg/week (lean)" },
    { value: 0.5,  label: "0.5 kg/week (moderate)" },
    { value: 1.0,  label: "1 kg/week (aggressive)" },
  ],
};

export default function ProfileForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    age:              25,
    weight_kg:        70,
    height_cm:        170,
    sex:              "male",
    activity_level:   "moderate",
    goal:             "weight_loss",
    weekly_goal_kg:   0.5,
    cuisine_preference: "",
    available_ingredients:   [],
    unavailable_ingredients: [],
    meal_time:        "dinner",
    surplus_deficit_kcal: 0,
  });

  const [ingInput,   setIngInput]   = useState("");
  const [noIngInput, setNoIngInput] = useState("");
  const [useWearable, setUW]        = useState(true);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const addIngredient = (type) => {
    const raw   = type === "available" ? ingInput : noIngInput;
    const items = raw.split(",").map(s => s.trim()).filter(Boolean);
    if (!items.length) return;
    if (type === "available") {
      set("available_ingredients", [...new Set([...form.available_ingredients, ...items])]);
      setIngInput("");
    } else {
      set("unavailable_ingredients", [...new Set([...form.unavailable_ingredients, ...items])]);
      setNoIngInput("");
    }
  };

  const removeIngredient = (type, item) => {
    if (type === "available") {
      set("available_ingredients", form.available_ingredients.filter(i => i !== item));
    } else {
      set("unavailable_ingredients", form.unavailable_ingredients.filter(i => i !== item));
    }
  };

  const handleKeyDown = (e, type) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addIngredient(type);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // weekly_goal_kg drives surplus_deficit_kcal automatically
    onSubmit({ ...form, surplus_deficit_kcal: 0 }, false);
  };

  const weeklyOptions = WEEKLY_GOAL_OPTIONS[form.goal] || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Age / Weight / Height */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "AGE",        key: "age",       type: "number" },
          { label: "WEIGHT (KG)", key: "weight_kg", type: "number" },
          { label: "HEIGHT (CM)", key: "height_cm", type: "number" },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
              {label}
            </label>
            <input
              type={type}
              value={form[key]}
              onChange={e => set(key, parseFloat(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        ))}
      </div>

      {/* Sex */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
          BIOLOGICAL SEX
        </label>
        <div className="grid grid-cols-2 gap-2">
          {["male", "female"].map(s => (
            <button
              key={s} type="button"
              onClick={() => set("sex", s)}
              className={`py-2 rounded-xl text-sm font-semibold capitalize transition
                ${form.sex === s
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Activity level */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
          ACTIVITY LEVEL
        </label>
        <div className="space-y-1">
          {ACTIVITY_OPTIONS.map(opt => (
            <button
              key={opt.value} type="button"
              onClick={() => set("activity_level", opt.value)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl
                text-sm transition
                ${form.activity_level === opt.value
                  ? "bg-teal-50 border border-teal-300 text-teal-800"
                  : "bg-slate-50 border border-transparent text-slate-600 hover:bg-slate-100"}`}
            >
              <span className="font-medium">{opt.label}</span>
              <span className="text-xs text-slate-400">{opt.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Goal + weekly target */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
          GOAL
        </label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { value: "weight_loss",  label: "Weight loss" },
            { value: "maintenance",  label: "Maintenance" },
            { value: "muscle_gain",  label: "Muscle gain" },
          ].map(g => (
            <button
              key={g.value} type="button"
              onClick={() => {
                set("goal", g.value);
                if (g.value === "maintenance") set("weekly_goal_kg", 0);
                else set("weekly_goal_kg", 0.5);
              }}
              className={`py-2 rounded-xl text-sm font-semibold transition
                ${form.goal === g.value
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Weekly rate — only for weight loss or muscle gain */}
        {form.goal !== "maintenance" && weeklyOptions.length > 0 && (
          <div>
            <label className="text-xs text-slate-500 mb-1 block">
              Rate ({form.goal === "weight_loss" ? "lose" : "gain"})
            </label>
            <select
              value={form.weekly_goal_kg}
              onChange={e => set("weekly_goal_kg", parseFloat(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
            >
              {weeklyOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              ≈ {Math.round(form.weekly_goal_kg * 7700 / 7)} kcal/day{" "}
              {form.goal === "weight_loss" ? "deficit" : "surplus"}
            </p>
          </div>
        )}
      </div>

      {/* Meal time */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-2">
          MEAL TIME — NHANES energy fraction
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: "breakfast", label: "Breakfast", pct: "18%" },
            { value: "lunch",     label: "Lunch",     pct: "24%" },
            { value: "dinner",    label: "Dinner",    pct: "35%" },
            { value: "snack",     label: "Snack",     pct: "23%" },
          ].map(m => (
            <button
              key={m.value} type="button"
              onClick={() => set("meal_time", m.value)}
              className={`py-2 rounded-xl text-xs font-semibold transition text-center
                ${form.meal_time === m.value
                  ? "bg-teal-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              <div>{m.label}</div>
              <div className="opacity-70">{m.pct}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
          CUISINE PREFERENCE
        </label>
        <input
          type="text"
          value={form.cuisine_preference}
          onChange={e => set("cuisine_preference", e.target.value)}
          placeholder="e.g. Indian, Italian, Mexican"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm
            focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      {/* Available ingredients */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
          AVAILABLE INGREDIENTS
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={ingInput}
            onChange={e => setIngInput(e.target.value)}
            onKeyDown={e => handleKeyDown(e, "available")}
            placeholder="Type ingredient and press Enter"
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            type="button"
            onClick={() => addIngredient("available")}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700
              text-sm font-semibold rounded-xl transition"
          >
            Add
          </button>
        </div>
        {form.available_ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.available_ingredients.map(ing => (
              <span
                key={ing}
                className="flex items-center gap-1 bg-teal-50 text-teal-700
                  border border-teal-200 text-xs px-3 py-1 rounded-full"
              >
                {ing}
                <button
                  type="button"
                  onClick={() => removeIngredient("available", ing)}
                  className="ml-1 hover:text-teal-900 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Unavailable ingredients */}
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">
          INGREDIENTS I DON'T HAVE
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={noIngInput}
            onChange={e => setNoIngInput(e.target.value)}
            onKeyDown={e => handleKeyDown(e, "unavailable")}
            placeholder="Type ingredient and press Enter"
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <button
            type="button"
            onClick={() => addIngredient("unavailable")}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700
              text-sm font-semibold rounded-xl transition"
          >
            Add
          </button>
        </div>
        {form.unavailable_ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.unavailable_ingredients.map(ing => (
              <span
                key={ing}
                className="flex items-center gap-1 bg-rose-50 text-rose-700
                  border border-rose-200 text-xs px-3 py-1 rounded-full"
              >
                {ing}
                <button
                  type="button"
                  onClick={() => removeIngredient("unavailable", ing)}
                  className="ml-1 hover:text-rose-900 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Wearable toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          className={`relative w-10 h-5 rounded-full transition-colors
            ${useWearable ? "bg-teal-500" : "bg-slate-200"}`}
          onClick={() => setUW(v => !v)}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow
              transition-transform duration-200
              ${useWearable ? "translate-x-5" : "translate-x-0.5"}`}
          />
        </div>
        <span className="text-sm text-slate-600">
          Include wearable data
          <span className="text-slate-400 ml-1">
            {useWearable ? "(mock simulated data)" : "(manual only)"}
          </span>
        </span>
      </label>

      {/* Google Fit button */}
      <button
        type="button"
        onClick={() => onSubmit({ ...form, surplus_deficit_kcal: 0 }, true)}
        disabled={loading}
        className="w-full py-3 bg-white hover:bg-slate-50 disabled:bg-slate-100
          text-slate-700 text-sm font-semibold rounded-xl transition-colors
          border-2 border-slate-200 hover:border-teal-400 flex items-center justify-center gap-2"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Connect Google Fit and compute
      </button>

      {/* Mock submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300
          text-white text-sm font-semibold rounded-xl transition-colors"
      >
        {loading ? "Computing profile…" : "Compute with mock wearable"}
      </button>

    </form>
  );
}