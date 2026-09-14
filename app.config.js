// app.config.js
// Version dinamica de app.json: permite resolver el archivo de Firebase
// (google-services.json) desde una variable de entorno de EAS en vez de
// depender de que el archivo este trackeado por git (no lo esta, ya que
// contiene credenciales del proyecto de Firebase).
module.exports = {
  expo: {
    name: "T-SAFV",
    slug: "T-SAFV-App-V",
    version: "1.0.0",
    orientation: "default",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSFaceIDUsageDescription:
          "Usamos Face ID para desbloquear tu sesión de forma rápida y segura.",
      },
    },
    android: {
      package: "com.tsafv.app.v",
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#09111a",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "@react-native-community/datetimepicker",
      "expo-font",
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#0f5fd2",
        },
      ],
      "expo-sharing",
      "expo-status-bar",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash.png",
          resizeMode: "contain",
          backgroundColor: "#09111a",
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "6c51b720-e22b-4293-9d0f-f21f6865ee25",
      },
    },
  },
};
