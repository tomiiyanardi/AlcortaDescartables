import { useState, useEffect } from "react";
import apiClient from "../api";

// Importamos nuestros nuevos componentes de UI
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

// --- Íconos SVG para los botones ---
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

const VALORES_INICIALES_FORMULARIO = {
  nombre: "",
  codigo: "",
  precio_costo: "",
  precio_venta: "",
  stock: 0,
  stock_minimo: 0,
};

function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Estados del Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" o "edit"
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  // Estado unificado para el formulario del modal
  const [formData, setFormData] = useState(VALORES_INICIALES_FORMULARIO);

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

  // --- 3. MANEJADOR PARA CAMBIOS EN EL FORMULARIO ---
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- 4. FUNCIONES DE APERTURA DEL MODAL ---
  const abrirModalCrear = () => {
    setModalMode("create");
    setProductoSeleccionado(null);
    setFormData(VALORES_INICIALES_FORMULARIO);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (producto) => {
    setModalMode("edit");
    setProductoSeleccionado(producto); // Guardamos el producto entero
    setFormData({ ...producto }); // Rellenamos el form con sus datos
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
  };

  // --- 5. FUNCIÓN PARA ENVIAR EL FORMULARIO (POST / PUT) ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // El 'productoSeleccionado' solo existe en modo 'edit' y tiene el ID
    const url = (modalMode === 'edit') 
      ? `/productos/${productoSeleccionado.id}/` 
      : "/productos/";
      
    const method = (modalMode === 'edit') ? 'put' : 'post';

    try {
      await apiClient[method](url, formData);
      
      cerrarModal();
      fetchProductos(); // Recargar la lista de productos

    } catch (error) {
      console.error("Error al guardar el producto:", error.response.data);
      setError("Error al guardar. Revise los campos (ej. código duplicado).");
      // No cerramos el modal si hay error, para que pueda corregir
    }
  };

  // --- 6. FUNCIÓN PARA ELIMINAR (DELETE) ---
  const handleEliminar = async (productoId) => {
    // Pedir confirmación
    if (!window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      return;
    }

    try {
      await apiClient.delete(`/productos/${productoId}/`);
      fetchProductos(); // Recargar la lista
    } catch (error) {
      console.error("Error al eliminar el producto:", error.response.data);
      // Falla común: El producto está en una venta (error 400 o 500)
      setError("Error al eliminar. Es posible que el producto esté asociado a una venta.");
    }
  };


  // --- Renderizado ---

  if (loading) {
    return <div className="text-center p-10">Cargando productos...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Productos</h1>
        <Button variant="primary" onClick={abrirModalCrear}>
          Añadir Nuevo Producto
        </Button>
      </div>

      {/* Alerta de Error General */}
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
            {productos.map((producto) => (
              <tr key={producto.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{producto.nombre}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.codigo || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${producto.precio_venta}</td>
                
                {/* Stock condicional con color */}
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                  producto.stock <= producto.stock_minimo ? 'text-red-600' : 'text-green-600'
                }`}>
                  {producto.stock}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.stock_minimo}</td>
                
                {/* --- Botones de Acción --- */}
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
          </tbody>
        </table>
      </div>

      {/* --- MODAL PARA CREAR/EDITAR --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={cerrarModal}
        title={modalMode === 'create' ? "Añadir Nuevo Producto" : "Editar Producto"}
        // El footer del modal lo definimos aquí
        footer={
          <>
            <Button variant="secondary" onClick={cerrarModal}>
              Cancelar
            </Button>
            {/* El <Button> de submit está vinculado al 'id' del <form> */}
            <Button variant="primary" type="submit" form="producto-form">
              {modalMode === 'create' ? "Guardar Producto" : "Guardar Cambios"}
            </Button>
          </>
        }
      >
        {/* Este es el 'children' del modal: el formulario */}
        <form id="producto-form" onSubmit={handleFormSubmit} className="space-y-4">
          
          <Input
            label="Nombre" id="nombre" name="nombre"
            value={formData.nombre} onChange={handleFormChange}
            required
          />
          <Input
            label="Código" id="codigo" name="codigo"
            value={formData.codigo} onChange={handleFormChange}
            placeholder="Opcional (ej. P100)"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Precio Costo" id="precio_costo" name="precio_costo"
              type="number" step="0.01" min="0" value={formData.precio_costo}
              onChange={handleFormChange} required
            />
            <Input
              label="Precio Venta" id="precio_venta" name="precio_venta"
              type="number" step="0.01" min="0" value={formData.precio_venta}
              onChange={handleFormChange} required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stock Actual" id="stock" name="stock"
              type="number" min="0" value={formData.stock}
              onChange={handleFormChange} required
            />
            <Input
              label="Stock Mínimo" id="stock_minimo" name="stock_minimo"
              type="number" min="0" value={formData.stock_minimo}
              onChange={handleFormChange} required
            />
          </div>

          {/* Si hubo un error en el submit, lo mostramos dentro del modal */}
          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

export default ProductosPage;