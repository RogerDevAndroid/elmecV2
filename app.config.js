const IS_WEB = process.env.EXPO_PLATFORM === 'web';

export default {
  expo: {
    name: "ELMEC V2",
    slug: "elmec-mobile-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
      output: "static"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#ffffff",
          image: "./assets/splash.png",
          dark: {
            image: "./assets/splash.png",
            backgroundColor: "#000000"
          },
          imageWidth: 200
        }
      ],
      ...(IS_WEB ? [] : [
        // Only include these plugins for mobile
        [
          "expo-camera",
          {
            cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
            microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone",
            recordAudioAndroid: true
          }
        ],
        [
          "expo-image-picker",
          {
            photosPermission: "The app accesses your photos to let you share them."
          }
        ]
      ])
    ],
    experiments: {
      typedRoutes: true
    },
    scheme: "elmec"
  }
};