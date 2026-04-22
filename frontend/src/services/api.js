import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

export const computeProfile = (manualInput, useWearable = true, mockSeed = 42) =>
  api
    .post(`/health/profile?use_wearable=${useWearable}&mock_seed=${mockSeed}`, manualInput)
    .then((r) => r.data);

export const syncRealWearable = (manualInput, wearableData) =>
  api
    .post("/health/wearable/sync", {
      manual: manualInput,
      wearable: wearableData,
    })
    .then((r) => r.data);

export const getMockWearable = (seed = 42) =>
  api.get(`/health/mock-wearable?seed=${seed}`).then((r) => r.data);

export const ping = () =>
  api.get("/health/ping").then((r) => r.data);