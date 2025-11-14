import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Asegúrate de que esta importación esté aquí
import "./index.css";

// Importamos el Layout y las páginas
import Layout from "./components/Layout";
import DashboardPage from "./pages/DashboardPage";
import ProductosPage from "./pages/ProductosPage";
import RegistrarVentaPage from "./pages/RegistrarVentaPage";

// Definimos la estructura de rutas
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, 
    children: [
      {
        index: true, 
        element: <DashboardPage />,
      },
      {
        path: "/productos",
        element: <ProductosPage />,
      },
      {
        path: "/registrar-venta",
        element: <RegistrarVentaPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);