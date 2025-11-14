import { useState, useEffect } from "react";
import apiClient from "../api";
import Input from "../components/ui/Input";
// ¡Importamos el modal que acabamos de crear!
import ProductoFormModal from "../components/ProductoFormModal";

function RegistrarVentaPage() {
  // --- Estados ---
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [itemsVenta, setItemsVenta] = useState([]);
  
  // Estados para el formulario de añadir
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);
  
  // Estados para la Búsqueda
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // Estados de mensajes
  const [error, setError] =useState(null);
  const [exito, setExito] = useState(null);

  // --- NUEVOS ESTADOS: Para el Modal de Creación Rápida ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  // Guardará el nombre del producto que se buscó (ej. "Globos Rojos")
  const [modalInitialData, setModalInitialData] = useState({});

  // --- 1. FUNCIÓN PARA CARGAR PRODUCTOS (GET) ---
  const fetchProductos = async () => {
    try {
      const response = await apiClient.get("/productos/");
      const conStock = response.data.filter(p => p.stock > 0);
      setProductosDisponibles(conStock);
    } catch (error) {
      console.error("Error al obtener productos:", error);
    }
  };

  // --- 2. useEffect PARA CARGAR PRODUCTOS AL INICIO ---
  useEffect(() => {
    fetchProductos();
  }, []);

  // --- 3. LÓGICA DE BÚSQUEDA Y FILTRADO (Sin cambios) ---
  const productosFiltrados = productosDisponibles.filter(p =>
    p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
    (p.codigo && p.codigo.toLowerCase().includes(terminoBusqueda.toLowerCase()))
  );

  const handleBusquedaChange = (e) => {
    setTerminoBusqueda(e.target.value);
    setProductoSeleccionado("");
    setIsDropdownVisible(true);
  };

  const handleProductoClick = (producto) => {
    setProductoSeleccionado(producto.id);
    setTerminoBusqueda(producto.nombre);
    setIsDropdownVisible(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsDropdownVisible(false);
    }, 150);
  };

  // --- 4. FUNCIÓN PARA AÑADIR ITEM AL CARRITO (Sin cambios) ---
  const handleAddItem = () => {
    if (!productoSeleccionado || cantidadSeleccionada <= 0) {
      setError("Por favor, busca y selecciona un producto válido de la lista.");
      return;
    }
    const prodId = parseInt(productoSeleccionado);
    const cant = parseInt(cantidadSeleccionada);
    setError(null);
    const itemExistente = itemsVenta.find((item) => item.producto.id === prodId);

    if (itemExistente) {
      setItemsVenta((prevItems) =>
        prevItems.map((item) =>
          item.producto.id === prodId
            ? { ...item, cantidad: item.cantidad + cant }
            : item
        )
      );
    } else {
      const producto = productosDisponibles.find((p) => p.id === prodId);
      setItemsVenta((prevItems) => [
        ...prevItems,
        {
          producto: { id: producto.id, nombre: producto.nombre },
          cantidad: cant,
          precio_en_el_momento: producto.precio_venta,
        },
      ]);
    }
    setCantidadSeleccionada(1);
    setTerminoBusqueda("");
    setProductoSeleccionado("");
  };

  // --- 5. FUNCIÓN PARA ENVIAR LA VENTA (Sin cambios) ---
  const handleRegistrarVenta = async () => {
    // ... (lógica de registro de venta, sin cambios)
    if (itemsVenta.length === 0) {
      setError("No puedes registrar una venta vacía.");
      return;
    }
    setError(null);
    setExito(null);
    const payload = {
      items: itemsVenta.map((item) => ({
        producto: item.producto.id,
        cantidad: item.cantidad,
      })),
    };
    try {
      const response = await apiClient.post("/ventas/", payload);
      setExito(`¡Venta #${response.data.id} registrada! Total: $${response.data.total_venta}`);
      setItemsVenta([]);
      fetchProductos();
    } catch (error) {
      console.error("Error al registrar la venta:", error.response.data);
      if (error.response?.data?.detail) {
        setError(`Error: ${error.response.data.detail}`);
      } else {
        setError("Ocurrió un error desconocido.");
      }
    }
  };

  // --- 6. Cálculo del Total (Sin cambios) ---
  const totalVenta = itemsVenta.reduce(
    (acc, item) => acc + item.cantidad * item.precio_en_el_momento,
    0
  );

  // --- 7. NUEVAS FUNCIONES: PARA EL MODAL DE CREACIÓN RÁPIDA ---
  const handleAbrirModalCrear = () => {
    // Pre-rellenamos el formulario con el nombre que el usuario buscó
    setModalInitialData({
      nombre: terminoBusqueda, // <-- El nombre que buscó
      codigo: "",
      precio_costo: "",
      precio_venta: "",
      stock: 0,
      stock_minimo: 0,
    });
    setIsCreateModalOpen(true);
    setIsDropdownVisible(false); // Cerramos el desplegable de búsqueda
  };

  const handleModalSaveSuccess = (productoGuardado) => {
    // Cuando el modal guarda con éxito:
    // 1. Cerramos el modal
    setIsCreateModalOpen(false);
    
    // 2. Recargamos la lista de productos (para que aparezca en futuras búsquedas)
    fetchProductos();
    
    // 3. ¡Añadimos el nuevo producto al carrito automáticamente!
    setItemsVenta((prevItems) => [
      ...prevItems,
      {
        producto: { id: productoGuardado.id, nombre: productoGuardado.nombre },
        cantidad: 1, // Por defecto añadimos 1
        precio_en_el_momento: productoGuardado.precio_venta,
      },
    ]);
    
    // 4. Limpiamos el término de búsqueda
    setTerminoBusqueda("");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Registrar Nueva Venta</h1>

      {error && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 p-3 rounded">{error}</div>}
      {exito && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 p-3 rounded">{exito}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Columna Izquierda: Añadir Productos */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">1. Añadir Productos</h2>
          
          <div className="mb-4 relative">
            <Input
              label="Buscar Producto"
              id="buscar-producto"
              type="text"
              value={terminoBusqueda}
              onChange={handleBusquedaChange}
              onFocus={() => setIsDropdownVisible(true)}
              onBlur={handleBlur}
              placeholder="Escribe nombre o código..."
              autoComplete="off"
            />
            
            {/* --- Desplegable de Resultados (MODIFICADO) --- */}
            {isDropdownVisible && terminoBusqueda.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                {productosFiltrados.length > 0 ? (
                  productosFiltrados.map((p) => (
                    <div 
                      key={p.id} 
                      className="p-3 hover:bg-blue-100 cursor-pointer"
                      onMouseDown={() => handleProductoClick(p)} 
                    >
                      <p className="font-semibold">{p.nombre}</p>
                      <p className="text-sm text-gray-600">
                        Código: {p.codigo || 'N/A'} - Stock: {p.stock}
                      </p>
                    </div>
                  ))
                ) : (
                  // --- ESTE ES EL NUEVO BOTÓN "CREAR" ---
                  <div 
                    className="p-3 text-gray-500 cursor-pointer hover:bg-green-100"
                    onMouseDown={handleAbrirModalCrear} // <-- Llama al modal
                  >
                    No se encontró. <span className="font-semibold text-green-600">
                      Crear producto "{terminoBusqueda}"...
                    </span>
                  </div>
                )}
              </div>
            )}
            {/* --- FIN CAMPO DE BÚSQUEDA --- */}
          </div>

          <div className="mb-4">
            <Input
              label="Cantidad"
              id="cantidad"
              type="number"
              min="1"
              value={cantidadSeleccionada}
              onChange={(e) => setCantidadSeleccionada(e.target.value)}
            />
          </div>

          <button
            onClick={handleAddItem}
            className="w-full bg-blue-600 text-white p-2 rounded-md font-semibold hover:bg-blue-700 transition-colors"
          >
            Añadir al Carrito
          </button>
        </div>

        {/* Columna Derecha: Resumen de Venta (Sin cambios) */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">2. Resumen de Venta</h2>
          {/* ... (el resto del <table> y resumen de venta no cambia) ... */}
          <div className="mb-4 min-h-[150px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itemsVenta.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.producto.nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.cantidad}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.precio_en_el_momento}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${(item.cantidad * item.precio_en_el_momento).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {itemsVenta.length === 0 && (
              <p className="text-gray-500 text-center py-10">El carrito está vacío.</p>
            )}
          </div>
          <div className="border-t pt-4">
            <div className="text-2xl font-bold text-right mb-4 text-gray-800">
              Total: ${totalVenta.toFixed(2)}
            </div>
            <button
              onClick={handleRegistrarVenta}
              disabled={itemsVenta.length === 0}
              className={`w-full text-white p-3 rounded-md font-bold text-lg transition-colors ${
                itemsVenta.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Registrar Venta
            </button>
          </div>
        </div>
      </div>

      {/* --- RENDERIZAMOS EL MODAL DE CREACIÓN RÁPIDA --- */}
      <ProductoFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
        initialData={modalInitialData}
        onSaveSuccess={handleModalSaveSuccess}
      />
    </div>
  );
}

export default RegistrarVentaPage;