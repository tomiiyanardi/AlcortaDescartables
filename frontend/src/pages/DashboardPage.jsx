import { useState, useEffect } from "react";
import apiClient from "../api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Registrar los componentes de Chart.js que vamos a usar
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function DashboardPage() {
  // Estado para guardar todos los datos del dashboard
  const [data, setData] = useState({
    ventas_totales: 0,
    ventas_por_dia_ultima_semana: [],
    productos_bajo_stock: [],
  });
  const [loading, setLoading] = useState(true);

  // --- 1. FUNCIÓN PARA CARGAR DATOS DEL DASHBOARD ---
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/ventas/dashboard-data/");
      setData(response.data);
    } catch (error) {
      console.error("Error al obtener datos del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. useEffect PARA CARGAR DATOS AL INICIO ---
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // --- 3. PREPARAR DATOS PARA EL GRÁFICO ---
  const chartData = {
    labels: data.ventas_por_dia_ultima_semana.map((d) => d.date), // Eje X (Fechas)
    datasets: [
      {
        label: "Ventas por Día",
        data: data.ventas_por_dia_ultima_semana.map((d) => d.total), // Eje Y (Total)
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Ventas de los Últimos 7 Días",
      },
    },
  };

  if (loading) {
    return <div className="text-center p-10">Cargando dashboard...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* --- KPIs (Indicadores Clave) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Card: Ventas Totales */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-sm font-medium text-gray-500 uppercase">
            Ventas Totales (Histórico)
          </h2>
          <p className="text-3xl font-bold mt-2">
            ${parseFloat(data.ventas_totales).toFixed(2)}
          </p>
        </div>
        {/* Card: Productos con Bajo Stock */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-sm font-medium text-gray-500 uppercase">
            Items con Bajo Stock
          </h2>
          <p className="text-3xl font-bold mt-2">
            {data.productos_bajo_stock.length}
          </p>
        </div>
      </div>

      {/* --- Gráfico y Lista de Bajo Stock --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Gráfico */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Rendimiento de Ventas</h2>
          {data.ventas_por_dia_ultima_semana.length > 0 ? (
            <Line options={chartOptions} data={chartData} />
          ) : (
            <p>No hay datos de ventas recientes para mostrar.</p>
          )}
        </div>

        {/* Columna Derecha: Lista de Bajo Stock */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Productos con Bajo Stock</h2>
          <ul className="divide-y divide-gray-200">
            {data.productos_bajo_stock.length > 0 ? (
              data.productos_bajo_stock.map((producto) => (
                <li key={producto.id} className="py-3">
                  <span className="font-medium">{producto.nombre}</span>
                  <span className="block text-sm text-red-600">
                    Stock actual: {producto.stock} (Mínimo: {producto.stock_minimo})
                  </span>
                </li>
              ))
            ) : (
              <p className="text-gray-500">¡Todo en orden! No hay productos por debajo del stock mínimo.</p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;