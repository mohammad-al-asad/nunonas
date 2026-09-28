// Google sign-in returns to <package>:/oauthredirect. expo-auth-session reads that
// URL itself, so keep Expo Router from treating it as a screen to open.
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  try {
    if (path.includes("oauthredirect")) {
      return initial ? "/" : "";
    }
    return path;
  } catch {
    return initial ? "/" : path;
  }
}
