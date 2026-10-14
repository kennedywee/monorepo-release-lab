import Constants from "expo-constants";
import { createApi } from "@release-lab/api";

// Order of precedence:
// 1. EXPO_PUBLIC_API_URL, set in a shell, a .env file, or an eas.json build profile.
//    Android emulator example: EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
// 2. In development, the computer that runs the Expo bundler. This works for
//    simulators and for physical devices on the same network (start Rails with -b 0.0.0.0).
// 3. localhost.
// EXPO_PUBLIC_ values are compiled into the app and are public. Never put secrets in them.
function resolveApiUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  const bundlerHost = Constants.expoConfig?.hostUri?.split(":")[0];
  if (__DEV__ && bundlerHost) return `http://${bundlerHost}:3000`;

  return "http://localhost:3000";
}

export const api = createApi(resolveApiUrl());
