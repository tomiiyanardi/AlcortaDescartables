import axios from "axios";

// --- Función para obtener el Cookie CSRF ---
// (Esta función la dejamos, es necesaria para la autenticación de sesión
// que usa el 'obtain_auth_token' y el admin de Django)
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
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
  baseURL: "https://alcorta-backend.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Sigue siendo necesario para el CSRF
});

// --- Interceptor de Peticiones (MODIFICADO) ---
// Ahora hará 2 cosas: buscar el token CSRF y buscar el token de Auth.
apiClient.interceptors.request.use((config) => {
  
  // --- 1. LÓGICA DEL TOKEN DE AUTENTICACIÓN (La "Llave") ---
  // Buscamos el token que guardamos en localStorage al iniciar sesión
  const token = localStorage.getItem("authToken");
  if (token) {
    // Si existe, lo añadimos al encabezado de 'Authorization'
    // El formato "Token <token>" es el que espera DRF
    config.headers["Authorization"] = `Token ${token}`;
  }
  // ----------------------------------------------------

  // --- 2. LÓGICA DEL TOKEN CSRF (Para POST/PUT/DELETE) ---
  if (!["GET", "HEAD", "OPTIONS"].includes(config.method.toUpperCase())) {
    const csrftoken = getCookie("csrftoken");
    if (csrftoken) {
      config.headers["X-CSRFToken"] = csrftoken;
    }
  }
  // ----------------------------------------------------
  
  return config;
});

export default apiClient;