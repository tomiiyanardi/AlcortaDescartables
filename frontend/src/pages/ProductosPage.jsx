import { useState, useEffect } from "react";
import apiClient from "../api";

// Componentes de UI
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
// ¡Importamos nuestro nuevo modal!
import ProductoFormModal from "../components/ProductoFormModal";

// --- Íconos SVG (sin cambios) ---
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.454 0a48.108 48.108 0 0 1-3.478-.397m15.932 0a48.108 48.108 0 0 0-4.43-4.43m-7.07 0a48.108 48.108 0 0 1-4.43-4.43" />
  </svg>
);
// --- Fin de Íconos SVG ---

// Valores por defecto para el formulario de CREAR
const VALORES_INICIALES_FORMULARIO = {
  nombre: "", codigo: "", precio_costo: "",
  precio_venta: "", stock: 0, stock_minimo: 0,
};

function ProductosPage() {
  const [productos, setProductos] = useState([]); // Master list
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");

  // --- Estados del Modal (simplificados) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  // Guarda los datos del producto a editar, o los valores iniciales para crear
  const [modalInitialData, setModalInitialData] = useState(VALORES_INICIALES_FORMULARIO);

  // --- 1. FUNCIÓN PARA CARGAR PRODUCTOS (GET) ---
  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/productos/");
      setProductos(response.data);
    } catch (error) {
      console.error("Error al obtener productos:", error);
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. useEffect PARA CARGAR DATOS AL INICIO ---
  useEffect(() => {
    fetchProductos();
  }, []);

  // --- 3. LÓGICA DE BÚSQUEDA Y FILTRADO ---
  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
    (p.codigo && p.codigo.toLowerCase().includes(terminoBusqueda.toLowerCase()))
  );

  // --- 4. FUNCIONES DE APERTURA DEL MODAL ---
  const abrirModalCrear = () => {
    setModalMode("create");
    setModalInitialData(VALORES_INICIALES_FORMULARIO);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (producto) => {
    setModalMode("edit");
    setModalInitialData(producto);
    setIsModalOpen(true);
  };

  // --- 5. FUNCIÓN PARA ELIMINAR (DELETE) ---
  const handleEliminar = async (productoId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      return;
    }
    try {
      await apiClient.delete(`/productos/${productoId}/`);
      fetchProductos();
      setError(null);
    } catch (error) {
      console.error("Error al eliminar el producto:", error.response);
      if (error.response && error.response.status === 400 && error.response.data.detail) {
         setError(error.response.data.detail);
      } else if (error.response?.data) {
        const errorMsg = Object.values(error.response.data).join('; ');
        setError(`Error: ${errorMsg}`);
      } else {
        setError("Ocurrió un error desconocido al intentar eliminar.");
      }
    }
  };

  // --- 6. Callback cuando el modal guarda con éxito ---
  const handleSaveSuccess = (productoGuardado) => {
    // No necesitamos hacer nada extra, solo recargar la lista
    fetchProductos();
    // (Podríamos ser más eficientes y solo actualizar/añadir el 'productoGuardado'
    // a la lista 'productos', pero recargar es más simple y robusto por ahora)
  };


  // --- Renderizado ---
  if (loading) {
    return <div className="text-center p-10">Cargando productos...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Productos</h1>
        <Button variant="primary" onClick={abrirModalCrear}>
          Añadir Nuevo Producto
        </Button>
      </div>

      <div className="mb-6">
        <Input
          id="buscar-producto"
          type="text"
          value={terminoBusqueda}
          onChange={(e) => setTerminoBusqueda(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="w-full md:w-1/3"
        />
      </div>

      {/* Alerta de Error General (para Eliminar) */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
          <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <span className="text-red-500">×</span>
          </button>
        </div>
      )}

      {/* --- TABLA DE PRODUCTOS --- */}
      <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P. Venta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Mín.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productosFiltrados.map((producto) => (
              <tr key={producto.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{producto.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.codigo || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${producto.precio_venta}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                  producto.stock <= producto.stock_minimo ? 'text-red-600' : 'text-green-600'
                }`}>
                  {producto.stock}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.stock_minimo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => abrirModalEditar(producto)}
                    className="text-blue-600 hover:text-blue-900 transition-colors"
                    title="Editar"
                  >
                    <PencilIcon />
                  </button>
                  <button
                    onClick={() => handleEliminar(producto.id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                    title="Eliminar"
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
            {productosFiltrados.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No se encontraron productos que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- RENDERIZAMOS EL NUEVO COMPONENTE MODAL --- */}
      <ProductoFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        initialData={modalInitialData}
        onSaveSuccess={handleSaveSuccess}
      />
      
    </div>
  );
}

export default ProductosPage;