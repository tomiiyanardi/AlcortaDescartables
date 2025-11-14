import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
  // 1. Revisamos si la "llave" (token) está guardada
  const token = localStorage.getItem("authToken");

  // 2. Comprobamos
  if (!token) {
    // 3. Si no hay token, redirigimos a /login
    return <Navigate to="/login" replace />;
  }

  // 4. Si hay token, dejamos que el usuario vea el contenido (el Layout)
  // <Outlet> representa a los componentes "hijos" (nuestro Layout)
  return <Outlet />;
}

export default ProtectedRoute;