import { useState, useEffect } from "react";
import apiClient from "../api";
import Input from "../components/ui/Input";

// Ícono de Basura
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-600 hover:text-red-800 cursor-pointer">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.454 0a48.108 48.108 0 0 1-3.478-.397m15.932 0a48.108 48.108 0 0 0-4.43-4.43m-7.07 0a48.108 48.108 0 0 1-4.43-4.43" />
  </svg>
);

// (Las funciones getToday y getFirstDayOfMonth siguen igual...)
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
      console.error("Error:", error);
      setError("No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVentas(); }, [startDate, endDate]);

  // --- NUEVA FUNCIÓN DE ELIMINAR ---
  const handleDeleteVenta = async (id) => {
    if (!window.confirm(`¿Seguro que quieres ANULAR la venta #${id}? El stock de los productos será devuelto.`)) {
      return;
    }
    try {
      await apiClient.delete(`/ventas/${id}/`);
      // Recargamos la lista
      fetchVentas();
    } catch (error) {
      console.error("Error al eliminar venta:", error);
      alert("Error al eliminar la venta.");
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
        <div className="flex gap-4">
          <Input label="Desde" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="Hasta" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventas.map((venta) => (
              <tr key={venta.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">#{venta.id}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(venta.fecha)}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <ul className="list-disc list-inside">
                    {venta.items.map((item) => (
                      <li key={item.id}>
                        {/* Mostramos hasta 3 decimales si es necesario */}
                        <span className="font-bold">{parseFloat(item.cantidad)}</span> x {item.producto_nombre}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900">${parseFloat(venta.total_venta).toFixed(2)}</td>
                
                {/* Botón de Eliminar */}
                <td className="px-6 py-4 text-sm">
                   <button onClick={() => handleDeleteVenta(venta.id)} title="Anular Venta">
                      <TrashIcon />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default HistorialVentasPage;