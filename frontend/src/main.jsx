import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// ¡Esta es la importación clave para cargar los estilos de Tailwind!
import "./index.css";

// --- Componentes de autenticación ---
import LoginPage from "./pages/LoginPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// --- Layout y Páginas ---
import Layout from "./components/Layout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProductosPage from "./pages/ProductosPage.jsx";
import RegistrarVentaPage from "./pages/RegistrarVentaPage.jsx";
import HistorialVentasPage from "./pages/HistorialVentasPage.jsx";
import RegistrarCompraPage from "./pages/RegistrarCompraPage.jsx";

// --- Estructura de Rutas ---
const router = createBrowserRouter([
  {
    // Ruta Pública
    path: "/login",
    element: <LoginPage />,
  },
  {
    // Rutas Protegidas
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <Layout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "/productos", element: <ProductosPage /> },
          { path: "/registrar-venta", element: <RegistrarVentaPage /> },
          { path: "/historial", element: <HistorialVentasPage /> },
          { path: "/registrar-compra", element: <RegistrarCompraPage /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);