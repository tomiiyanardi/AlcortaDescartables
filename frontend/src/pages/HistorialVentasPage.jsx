import { useState, useEffect } from "react";
import apiClient from "../api";
import Input from "../components/ui/Input";

// --- Funciones Helper para Fechas (copiadas del Dashboard) ---
const getToday = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getFirstDayOfMonth = () => {
  const date = new Date();
  date.setDate(1); // Pone el día 1
  return date.toISOString().split('T')[0];
};
// ------------------------------------

function HistorialVentasPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados para las Fechas ---
  // Por defecto, mostramos el mes actual
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getToday());

  // --- 1. FUNCIÓN PARA CARGAR DATOS (CON FILTRO) ---
  const fetchVentas = async () => {
    setLoading(true);
    setError(null);
    
    // Construimos los parámetros de la URL
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });

    try {
      // Usamos el endpoint '/api/ventas/' que ya filtra por fecha
      const response = await apiClient.get(`/ventas/?${params.toString()}`);
      setVentas(response.data);
    } catch (error) {
      console.error("Error al obtener historial de ventas:", error);
      setError("No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. useEffect PARA RECARGAR DATOS ---
  // Se ejecuta al inicio Y CADA VEZ que 'startDate' o 'endDate' cambian
  useEffect(() => {
    if (new Date(endDate) < new Date(startDate)) {
      setError("La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'.");
      return;
    }
    fetchVentas();
  }, [startDate, endDate]); // <-- Dependencias

  // --- 3. Cálculo de Totales (opcional, para un resumen) ---
  const totalFiltrado = ventas.reduce((acc, venta) => acc + parseFloat(venta.total_venta), 0);

  // Función para formatear la fecha
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Historial de Ventas</h1>
        
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* --- Resumen de Totales --- */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold text-gray-700">Total del Período</h2>
        <p className="text-2xl font-bold text-blue-600">
          ${totalFiltrado.toFixed(2)}
        </p>
        <p className="text-sm text-gray-500">
          Mostrando {ventas.length} ventas entre {startDate} y {endDate}
        </p>
      </div>

      {/* --- TABLA DE VENTAS --- */}
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Venta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha y Hora</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items Vendidos</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Venta</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-500">Cargando historial...</td>
              </tr>
            ) : ventas.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-500">No se encontraron ventas en este período.</td>
              </tr>
            ) : (
              // --- Mapeo de Ventas ---
              ventas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50">
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{venta.id}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(venta.fecha)}
                  </td>
                  
                  {/* --- Mapeo Anidado de Items --- */}
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <ul className="list-disc list-inside space-y-1">
                      {venta.items.map((item) => (
                        <li key={item.id}>
                          <span className="font-semibold">{item.cantidad}x</span> {item.producto_nombre} 
                          <span className="text-gray-600"> (@ ${parseFloat(item.precio_en_el_momento).toFixed(2)})</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  {/* --- Fin Mapeo Anidado --- */}

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ${parseFloat(venta.total_venta).toFixed(2)}
                  </td>
                </tr>
              ))
              // --- Fin Mapeo de Ventas ---
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistorialVentasPage;