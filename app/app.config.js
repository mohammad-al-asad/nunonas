export default {
  expo: {
    name: "Activity Planner",
    slug: "activity-planner",
    // The package-name scheme receives Google sign-in redirects (<package>:/oauthredirect).
    scheme: ["nuno-app", "com.nuno.activityplanner"],
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.nuno.activityplanner",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.nuno.activityplanner",
      permissions: [
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Allow Activity Planner to use your location during signup to personalize nearby recommendations.",
        },
      ],
      [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
          iosGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        },
      ],
    ],
    extra: {
      router: {},
      eas: {
        projectId: "d3eed72a-3c1d-4ba3-9cd2-4e1b240bb297",
      },
    },
  },
};
