import { useState, useEffect } from "react";
import apiClient from "../api";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend,
} from "chart.js";
import Input from "../components/ui/Input"; // Usaremos nuestro Input

// Registrar Chart.js
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

// --- Funciones Helper para Fechas ---

// Función para obtener la fecha de hoy en formato YYYY-MM-DD
const getToday = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Función para obtener la fecha de hace N días
const getPastDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
};
// ------------------------------------

function DashboardPage() {
  // Estado para guardar todos los datos del dashboard
  const [data, setData] = useState({
    ventas_totales_historico: 0,
    productos_bajo_stock: [],
    rango_total_vendido: 0,
    rango_total_costo: 0,
    rango_ganancia_neta: 0,
    ventas_por_dia: [],
  });
  const [loading, setLoading] = useState(true);

  // --- Estados para las Fechas ---
  // Por defecto, mostramos los últimos 7 días (hoy y 6 días atrás)
  const [startDate, setStartDate] = useState(getPastDate(6)); 
  const [endDate, setEndDate] = useState(getToday());

  // --- 1. FUNCIÓN PARA CARGAR DATOS (MODIFICADA) ---
  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Construimos los parámetros de la URL
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });

    try {
      // Enviamos la petición con las fechas
      const response = await apiClient.get(`/ventas/dashboard-data/?${params.toString()}`);
      setData(response.data);
    } catch (error) {
      console.error("Error al obtener datos del dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. useEffect PARA RECARGAR DATOS ---
  // Se ejecuta al inicio Y CADA VEZ que 'startDate' o 'endDate' cambian
  useEffect(() => {
    // Validamos que la fecha final no sea menor que la inicial
    if (new Date(endDate) < new Date(startDate)) {
      // Si es inválido, no hacemos nada (o podríamos mostrar un error)
      return; 
    }
    fetchDashboardData();
  }, [startDate, endDate]); // <-- Dependencias

  // --- 3. PREPARAR DATOS PARA EL GRÁFICO ---
  const chartData = {
    labels: data.ventas_por_dia.map((d) => d.date), // Eje X (Fechas)
    datasets: [
      {
        label: "Ventas por Día",
        data: data.ventas_por_dia.map((d) => d.total), // Eje Y (Total)
        fill: false,
        borderColor: "rgb(59, 130, 246)", // Un azul más bonito
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.1,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: `Rendimiento de Ventas (${startDate} al ${endDate})` },
    },
  };

  // Usamos 'loading' para el spinner inicial
  if (loading && data.ventas_por_dia.length === 0) {
    return <div className="text-center p-10">Cargando dashboard...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        
        {/* --- FILTROS DE FECHA --- */}
        <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
          <Input
            label="Desde"
            type="date"
            id="start_date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Hasta"
            type="date"
            id="end_date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* --- KPIs (Indicadores Clave) --- */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">
        Análisis del Período {loading && <span className="text-sm">(Actualizando...)</span>}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card: Monto Total Vendido (en rango) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase">
            Monto Total Vendido
          </h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">
            ${parseFloat(data.rango_total_vendido).toFixed(2)}
          </p>
        </div>

        {/* Card: Costo de Mercadería */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase">
            Costo de Mercadería
          </h3>
          <p className="text-3xl font-bold mt-2 text-red-600">
            -${parseFloat(data.rango_total_costo).toFixed(2)}
          </p>
        </div>
        
        {/* Card: Ganancia Neta */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500 uppercase">
            Ganancia Neta (Aprox.)
          </h3>
          <p className="text-3xl font-bold mt-2 text-green-600">
            ${parseFloat(data.rango_ganancia_neta).toFixed(2)}
          </p>
        </div>
      </div>

      {/* --- Gráfico y Lista de Bajo Stock --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Columna Izquierda: Gráfico */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md h-[400px]">
          <h2 className="text-xl font-semibold mb-4">Rendimiento de Ventas</h2>
          {data.ventas_por_dia.length > 0 ? (
            <div className="h-80">
              <Line options={chartOptions} data={chartData} />
            </div>
          ) : (
            <p>No hay datos de ventas en este período.</p>
          )}
        </div>

        {/* Columna Derecha: Lista de Bajo Stock */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-[400px]">
          <h2 className="text-xl font-semibold mb-4">Alerta de Stock</h2>
          <div className="max-h-80 overflow-y-auto">
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

      {/* --- KPI Histórico --- */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-500 uppercase">
          Ventas Totales (Histórico)
        </h3>
        <p className="text-2xl font-bold mt-2 text-gray-800">
          ${parseFloat(data.ventas_totales_historico).toFixed(2)}
        </p>
      </div>

    </div>
  );
}

export default DashboardPage;