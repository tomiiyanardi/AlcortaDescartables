import axios from "axios";

// --- Función para obtener el Cookie CSRF ---
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // ¿Este cookie string comienza con el nombre que queremos?
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}
// ------------------------------------------

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ¡Importante! Permite que axios envíe cookies
});

// --- Interceptor de Peticiones ---
// Antes de que cada petición se envíe, haz esto:
apiClient.interceptors.request.use((config) => {
  // Solo necesitamos el token para métodos "peligrosos" (que no sean GET, etc.)
  if (!["GET", "HEAD", "OPTIONS"].includes(config.method.toUpperCase())) {
    const csrftoken = getCookie("csrftoken");
    if (csrftoken) {
      config.headers["X-CSRFToken"] = csrftoken;
    }
  }
  return config;
});
// ----------------------------------

export default apiClient;