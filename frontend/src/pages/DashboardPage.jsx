import { useState, useEffect } from "react";
import apiClient from "../api";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import Input from "../components/ui/Input";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const getToday = () => { const today = new Date(); return today.toISOString().split('T')[0]; };
const getPastDate = (days) => { const date = new Date(); date.setDate(date.getDate() - days); return date.toISOString().split('T')[0]; };

function DashboardPage() {
  const [data, setData] = useState({
    ventas_totales_historico: 0,
    productos_bajo_stock: [],
    rango_total_vendido: 0,
    rango_total_costo: 0,
    rango_ganancia_neta: 0,
    ventas_por_dia: [],
    total_efectivo: 0,       // Nuevo
    total_transferencia: 0,  // Nuevo
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(getPastDate(6)); 
  const [endDate, setEndDate] = useState(getToday());

  const fetchDashboardData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    try {
      const response = await apiClient.get(`/ventas/dashboard-data/?${params.toString()}`);
      setData(response.data);
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (new Date(endDate) < new Date(startDate)) return;
    fetchDashboardData();
  }, [startDate, endDate]);

  const chartData = {
    labels: data.ventas_por_dia.map((d) => d.date),
    datasets: [
      {
        label: "Ventas por Día",
        data: data.ventas_por_dia.map((d) => d.total),
        fill: false,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.1,
      },
    ],
  };
  
  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "top" }, title: { display: true, text: `Rendimiento (${startDate} al ${endDate})` } } };

  if (loading && data.ventas_por_dia.length === 0) {
    return <div className="text-center p-10">Cargando dashboard...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
          <Input label="Desde" type="date" id="start_date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Hasta" type="date" id="end_date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* --- SECCIÓN 1: RESUMEN FINANCIERO (GANANCIAS) --- */}
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Resumen Financiero del Período</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Monto Total Vendido</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">${parseFloat(data.rango_total_vendido).toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Ganancia Neta (Aprox.)</h3>
          <p className="text-3xl font-bold mt-2 text-green-600">${parseFloat(data.rango_ganancia_neta).toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-500 uppercase">Costo Mercadería</h3>
          <p className="text-3xl font-bold mt-2 text-red-600">-${parseFloat(data.rango_total_costo).toFixed(2)}</p>
        </div>
      </div>

      {/* --- SECCIÓN 2: ARQUEO DE CAJA (NUEVO) --- */}
      <h2 className="text-xl font-semibold mb-4 text-gray-700">Arqueo de Caja</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Tarjeta Efectivo */}
        <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200">
          <h3 className="text-sm font-bold text-green-800 uppercase flex items-center gap-2">
            💵 Efectivo en Caja (Teórico)
          </h3>
          <p className="text-3xl font-bold mt-2 text-gray-800">
            ${parseFloat(data.total_efectivo || 0).toFixed(2)}
          </p>
        </div>
        {/* Tarjeta Transferencia */}
        <div className="bg-purple-50 p-6 rounded-lg shadow-sm border border-purple-200">
          <h3 className="text-sm font-bold text-purple-800 uppercase flex items-center gap-2">
            💳 Transferencias / MercadoPago
          </h3>
          <p className="text-3xl font-bold mt-2 text-gray-800">
            ${parseFloat(data.total_transferencia || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* --- SECCIÓN 3: GRÁFICO Y STOCK --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md h-[400px]">
          <h2 className="text-xl font-semibold mb-4">Rendimiento de Ventas</h2>
          {data.ventas_por_dia.length > 0 ? (
            <div className="h-80"><Line options={chartOptions} data={chartData} /></div>
          ) : <p>No hay datos.</p>}
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-[400px]">
          <h2 className="text-xl font-semibold mb-4">Alerta de Stock</h2>
          <div className="max-h-80 overflow-y-auto">
            <ul className="divide-y divide-gray-200">
              {data.productos_bajo_stock.length > 0 ? (
                data.productos_bajo_stock.map((producto) => (
                  <li key={producto.id} className="py-3">
                    <span className="font-medium">{producto.nombre}</span>
                    <span className="block text-sm text-red-600">Stock: {parseFloat(producto.stock)} (Mín: {producto.stock_minimo})</span>
                  </li>
                ))
              ) : <p className="text-gray-500">¡Todo en orden!</p>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;