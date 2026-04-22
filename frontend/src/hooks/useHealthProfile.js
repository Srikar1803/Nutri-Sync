import { useState, useCallback } from "react";
import { computeProfile, syncRealWearable } from "../services/api";
import { getGoogleFitToken, fetchGoogleFitData } from "../services/googleFit";

export function useHealthProfile() {
  const [profile,      setProfile]      = useState(null);
  const [queryString,  setQueryString]  = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [fitConnected, setFitConnected] = useState(false);

  const submit = useCallback(async (formData, useRealFit = false) => {
    setLoading(true);
    setError(null);
    try {
      let result;

      if (useRealFit) {
        // Real Google Fit flow
        const token    = await getGoogleFitToken();
        const wearable = await fetchGoogleFitData(token);
        setFitConnected(true);
        result = await syncRealWearable(formData, wearable);
      } else {
        // Mock wearable flow
        const seed = Math.floor(Math.random() * 9999);
        result = await computeProfile(formData, true, seed);
      }

      setProfile(result.health_profile);
      setQueryString(result.query_string);
    } catch (e) {
      const msg =
        e.response?.data?.detail ||
        e.message ||
        "Failed to compute profile. Is the backend running?";
      setError(msg);
      setFitConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProfile(null);
    setQueryString("");
    setError(null);
    setFitConnected(false);
  }, []);

  return {
    profile,
    queryString,
    loading,
    error,
    fitConnected,
    submit,
    reset,
  };
}