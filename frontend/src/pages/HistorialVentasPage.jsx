import { useState, useEffect } from "react";
import apiClient from "../api";
import Input from "../components/ui/Input";

// Ícono de Basura
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600 hover:text-red-800 cursor-pointer">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.454 0a48.108 48.108 0 0 1-3.478-.397m15.932 0a48.108 48.108 0 0 0-4.43-4.43m-7.07 0a48.108 48.108 0 0 1-4.43-4.43" />
  </svg>
);

const getToday = () => { const today = new Date(); return today.toISOString().split('T')[0]; };
const getFirstDayOfMonth = () => { const date = new Date(); date.setDate(1); return date.toISOString().split('T')[0]; };

function HistorialVentasPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getToday());

  const fetchVentas = async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    try {
      const response = await apiClient.get(`/ventas/?${params.toString()}`);
      setVentas(response.data);
    } catch (error) {
      console.error("Error al obtener historial:", error);
      setError("No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (new Date(endDate) < new Date(startDate)) return;
    fetchVentas();
  }, [startDate, endDate]);

  // --- FUNCIÓN PARA ELIMINAR VENTA ---
  const handleDeleteVenta = async (id) => {
    if (!window.confirm(`¿Seguro que quieres ANULAR la venta #${id}? El stock de los productos será restaurado.`)) {
      return;
    }
    try {
      await apiClient.delete(`/ventas/${id}/`);
      // Si funciona, recargamos la lista
      fetchVentas();
    } catch (error) {
      console.error("Error al eliminar venta:", error);
      alert("No se pudo eliminar la venta.");
    }
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Historial de Ventas</h1>
        <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
          <Input label="Desde" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Hasta" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Venta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-10 text-gray-500">Cargando...</td></tr>
            ) : ventas.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-10 text-gray-500">No hay ventas en este período.</td></tr>
            ) : (
              ventas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{venta.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(venta.fecha)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <ul className="list-disc list-inside">
                      {venta.items.map((item) => (
                        <li key={item.id}>
                          <span className="font-bold">{parseFloat(item.cantidad)}</span> x {item.producto_nombre}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ${parseFloat(venta.total_venta).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                     <button 
                       onClick={() => handleDeleteVenta(venta.id)} 
                       className="text-red-500 hover:text-red-700 transition-colors"
                       title="Anular Venta"
                     >
                        <TrashIcon />
                     </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default HistorialVentasPage;