import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";

// --- 1. Importamos los nuevos componentes ---
import LoginPage from "./pages/LoginPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Importamos el Layout y las páginas de la app
import Layout from "./components/Layout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ProductosPage from "./pages/ProductosPage.jsx";
import RegistrarVentaPage from "./pages/RegistrarVentaPage.jsx";
import HistorialVentasPage from "./pages/HistorialVentasPage.jsx";
import RegistrarCompraPage from "./pages/RegistrarCompraPage.jsx";

// --- 2. Definimos la nueva estructura de rutas ---
const router = createBrowserRouter([
  {
    // --- Ruta Pública: /login ---
    // Esta es la única ruta que NO está protegida
    path: "/login",
    element: <LoginPage />,
  },
  {
    // --- Rutas Protegidas ---
    // Usamos nuestro "Guardián" (ProtectedRoute)
    element: <ProtectedRoute />,
    children: [
      {
        // La ruta raíz '/' y todas sus hijas usarán el Layout
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