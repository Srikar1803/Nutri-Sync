const CLIENT_ID = '668593125905-5gqmfu0ns8srergsd2lunji2e96b15t1.apps.googleusercontent.com';
const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
].join(' ');

export function loadGoogleAuth() {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    document.body.appendChild(script);
  });
}

export async function getGoogleFitToken() {
  console.log("getGoogleFitToken called");
  await loadGoogleAuth();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        console.log("OAuth response:", response);
        if (response.error) {
          console.error("OAuth error:", response.error);
          reject(response.error);
        } else {
          console.log("Token received successfully");
          resolve(response.access_token);
        }
      },
    });
    client.requestAccessToken();
  });
}

export async function fetchGoogleFitData(accessToken) {
  console.log("fetchGoogleFitData called, token present:", !!accessToken);

  const now = Date.now();
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const startTime = midnight.getTime();
  console.log("Time window:", new Date(startTime).toISOString(), "→", new Date(now).toISOString());

  const headers = { Authorization: `Bearer ${accessToken}` };

  // Steps
  const stepsRes = await fetch(
    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
    {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName: 'com.google.step_count.delta' }],
        bucketByTime: { durationMillis: now - startTime },
        startTimeMillis: startTime,
        endTimeMillis: now,
      }),
    }
  );
  console.log("Steps API status:", stepsRes.status);
  const stepsData = await stepsRes.json();
  console.log("Steps raw data:", JSON.stringify(stepsData));
  const steps = stepsData.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0;
  console.log("Steps extracted:", steps);

  // Calories
  const calRes = await fetch(
    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
    {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName: 'com.google.calories.expended' }],
        bucketByTime: { durationMillis: now - startTime },
        startTimeMillis: startTime,
        endTimeMillis: now,
      }),
    }
  );
  console.log("Calories API status:", calRes.status);
  const calData = await calRes.json();
  console.log("Calories raw data:", JSON.stringify(calData));
  const activeCalories = calData.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal || 300;
  console.log("Active calories extracted:", activeCalories);

  // Sleep
  const sleepRes = await fetch(
    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
    {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName: 'com.google.sleep.segment' }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: now - 86400000,
        endTimeMillis: now,
      }),
    }
  );
  console.log("Sleep API status:", sleepRes.status);
  const sleepData = await sleepRes.json();
  console.log("Sleep raw data:", JSON.stringify(sleepData));
  const sleepPoints = sleepData.bucket?.[0]?.dataset?.[0]?.point || [];

  let sleepMs = 0;
  sleepPoints.forEach((point) => {
    const value = point.value?.[0]?.intVal;
    if (value && value >= 2) {
      const start = parseInt(point.startTimeNanos) / 1e6;
      const end   = parseInt(point.endTimeNanos)   / 1e6;
      sleepMs += end - start;
    }
  });

  const sleepHours = sleepMs > 0
    ? Math.round((sleepMs / 3600000) * 10) / 10
    : 7.0;
  console.log("Sleep hours extracted:", sleepHours);

  const sleepQuality = sleepHours >= 8 ? 0.90
    : sleepHours >= 7 ? 0.75
    : sleepHours >= 6 ? 0.60
    : 0.40;

  const basalCalories = Math.max(1400, 1800 - activeCalories * 0.3);

  const result = {
    active_calories_burned: Math.round(activeCalories * 10) / 10,
    basal_calories_burned:  Math.round(basalCalories  * 10) / 10,
    steps,
    sleep_hours:         sleepHours,
    sleep_quality_score: sleepQuality,
    hrv_ms:              null,
  };

  console.log("Final wearable payload sent to backend:", result);
  return result;
}