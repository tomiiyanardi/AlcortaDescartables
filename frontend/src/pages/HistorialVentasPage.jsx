import { useState, useEffect } from "react";
import apiClient from "../api";
import Input from "../components/ui/Input";

// --- IMPORTACIONES CORREGIDAS ---
// Usamos el nombre correcto del archivo que creamos antes
import VentaEditModal from "../components/VentaEditModal"; 
import DeleteConfirmationModal from "../components/ui/DeleteConfirmationModal"; 

// --- Íconos SVG ---
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0-.97-4.277M9 7.114V5.572m4.102.162L17 4m0 0l-4.102 2.162M12 4v16M8.7 10.5h6.6m-6.6 0-1.8 7.2M17 18.75V19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-.25" />
  </svg>
);
// ------------------------------------------------

// --- Funciones Helper para Fechas ---
const getToday = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getFirstDayOfMonth = () => {
  const date = new Date();
  date.setDate(1); 
  return date.toISOString().split('T')[0];
};
// ------------------------------------

function HistorialVentasPage() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getToday());

  // --- ESTADOS DE MODALES ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  // --- 1. FUNCIÓN PARA CARGAR DATOS (CON FILTRO) ---
  const fetchVentas = async () => {
    setLoading(true);
    setError(null);
    
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });

    try {
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
  useEffect(() => {
    if (new Date(endDate) < new Date(startDate)) {
      setError("La fecha 'Hasta' no puede ser anterior a la fecha 'Desde'.");
      return;
    }
    fetchVentas();
  }, [startDate, endDate]);

  // --- 3. MANEJADORES DE EDICIÓN ---
  const handleEditarVenta = (venta) => {
    setVentaSeleccionada(venta);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    fetchVentas(); 
    setIsEditModalOpen(false);
  };

  // --- 4. MANEJADORES DE ELIMINACIÓN ---
  const handleDeleteClick = (venta) => {
    setVentaSeleccionada(venta);
    setIsDeleteModalOpen(true);
  }

  const handleConfirmDelete = async () => {
    if (!ventaSeleccionada) return;
    
    try {
      await apiClient.delete(`/ventas/${ventaSeleccionada.id}/`);
      // Cerrar modal y actualizar la lista
      setIsDeleteModalOpen(false);
      setVentaSeleccionada(null);
      fetchVentas(); 
    } catch (error) {
      console.error("Error al eliminar la venta:", error);
      setError("Error al eliminar la venta. (Verifique el log del backend).");
    }
  }
  // --------------------------------

  // --- Cálculo de Totales ---
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500">Cargando historial...</td>
              </tr>
            ) : ventas.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-10 text-gray-500">No se encontraron ventas en este período.</td>
              </tr>
            ) : (
              ventas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{venta.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(venta.fecha)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <ul className="list-disc list-inside space-y-1">
                      {venta.items.map((item) => (
                        <li key={item.id}>
                          <span className="font-semibold">{parseFloat(item.cantidad)}x</span> {item.producto_nombre} 
                          <span className="text-gray-600"> (@ ${parseFloat(item.precio_en_el_momento).toFixed(2)})</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ${parseFloat(venta.total_venta).toFixed(2)}
                  </td>
                  
                  {/* --- BOTONES DE ACCIÓN --- */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex space-x-2 items-center">
                    <button 
                        onClick={() => handleEditarVenta(venta)} 
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Editar Venta"
                    >
                        <PencilIcon />
                    </button>
                    <button 
                        onClick={() => handleDeleteClick(venta)} 
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Eliminar Venta"
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
      
      {/* --- MODALES --- */}
      {isEditModalOpen && (
        <VentaEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          venta={ventaSeleccionada}
          onSaveSuccess={handleEditSuccess}
        />
      )}
      
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Eliminación de Venta"
        message={`¿Estás seguro de que quieres eliminar la Venta #${ventaSeleccionada?.id}? Esta acción es irreversible y el stock de los productos se REVERTIRÁ.`}
      />
    </div>
  );
}

export default HistorialVentasPage;