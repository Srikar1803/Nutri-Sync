import { useState, useCallback } from "react";
import axios from "axios";

const BASE = 'https://divisions-spring-sequences-horses.trycloudflare.com';

export function useRecipe() {
  const [recipes,     setRecipes]     = useState([]);
  const [impossible,  setImpossible]  = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  const generateRecipe = useCallback(async (queryString, healthProfile) => {
    setLoading(true);
    setError(null);
    setRecipes([]);
    setImpossible(null);

    try {
      const res = await axios.post(`${BASE}/recipe/generate`, {
        query_string:   queryString,
        health_profile: healthProfile,
        top_k:          10,
      });

      if (res.data.impossible) {
        setImpossible({
          reason:      res.data.reason,
          suggestions: res.data.suggestions || [],
        });
      } else {
        setRecipes(res.data.recipes || []);
      }
    } catch (e) {
      const msg =
        e.response?.data?.detail ||
        e.message ||
        "Failed to generate recipe.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setRecipes([]);
    setImpossible(null);
    setError(null);
  }, []);

  return { recipes, impossible, loading, error, generateRecipe, reset };
}