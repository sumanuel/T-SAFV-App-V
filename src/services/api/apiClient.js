/**
 * apiClient.js
 * Axios client apuntando a T-SAFV-API.
 * Para Android Emulator usa 10.0.2.2:3000
 * Para dispositivo físico en la misma red, cambia a la IP de tu máquina.
 */
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Ajusta según tu entorno:
//  - Emulador Android:  http://10.0.2.2:3000
//  - Dispositivo real:  http://<IP_LOCAL>:3000
//  - iOS Simulator:     http://localhost:3000
export const API_BASE_URL = "http://192.168.1.10:3000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor: agrega el token JWT a cada request si existe
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("@auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {
    // ignore storage errors
  }
  return config;
});

export default apiClient;
