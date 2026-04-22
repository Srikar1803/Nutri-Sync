import ProfileForm from "../components/ProfileForm";
import WearableCard from "../components/WearableCard";
import MacroDisplay from "../components/MacroDisplay";
import RecipeCard from "../components/RecipeCard";
import { useHealthProfile } from "../hooks/useHealthProfile";
import { useRecipe } from "../hooks/useRecipe";

export default function Dashboard() {
  const { profile, queryString, loading, error, submit, reset } =
    useHealthProfile();

  const {
    recipes,
    impossible,
    loading: recipeLoading,
    error:   recipeError,
    generateRecipe,
    reset:   resetRecipes,
  } = useRecipe();

  const handleReset = () => {
    reset();
    resetRecipes();
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              NutriSync
            </h1>
            <p className="text-xs text-slate-400">
              Biometric-aware recipe generation
            </p>
          </div>
          {profile && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-700 transition"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Left — form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-5">
              Your profile
            </h2>
            <ProfileForm onSubmit={submit} loading={loading} />
            {error && (
              <div className="mt-4 text-xs text-red-700 bg-red-50 border
                border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
          </div>

          {/* Right — results */}
          <div className="space-y-4">
            {profile ? (
              <>
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-700 mb-5">
                    Nutrition targets
                  </h2>
                  <MacroDisplay profile={profile} queryString={queryString} />
                </div>

                <WearableCard profile={profile} />

                {/* Generate Recipes button */}
                <button
                  onClick={() => generateRecipe(queryString, profile)}
                  disabled={recipeLoading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800
                    disabled:bg-slate-400 text-white text-sm font-semibold
                    rounded-xl transition-colors"
                >
                  {recipeLoading ? "Generating recipes…" : "Generate recipes"}
                </button>

                {recipeError && (
                  <div className="text-xs text-red-700 bg-red-50 border
                    border-red-200 rounded-xl px-4 py-3">
                    {recipeError}
                  </div>
                )}

                {/* Impossible — no recipe possible */}
                {impossible && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center
                        justify-center text-white text-xs font-bold shrink-0">
                        !
                      </div>
                      <p className="text-sm font-semibold text-amber-800">
                        No recipe possible with these ingredients
                      </p>
                    </div>
                    <p className="text-xs text-amber-700">{impossible.reason}</p>
                    {impossible.suggestions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-700 mb-2">
                          Try adding one of these:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {impossible.suggestions.map((s, i) => (
                            <span key={i}
                              className="text-xs bg-white border border-amber-300
                                text-amber-700 px-3 py-1 rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recipe cards */}
                {recipes.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {recipes.length} recipe{recipes.length > 1 ? "s" : ""} generated
                      </span>
                      <div className="flex-1 h-px bg-slate-100" />
                    </div>
                    {recipes.map((recipe, i) => (
                      <RecipeCard
                        key={i}
                        recipe={recipe}
                        index={i + 1}
                        unavailableIngredients={profile.unavailable_ingredients || []}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-6
                shadow-sm flex flex-col items-center justify-center h-64 text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center
                  justify-center mb-3">
                  <div className="w-6 h-6 rounded-full border-2 border-teal-300" />
                </div>
                <p className="text-sm text-slate-400">
                  Fill in your profile to see nutrition targets
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  and generate recipes
                </p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}