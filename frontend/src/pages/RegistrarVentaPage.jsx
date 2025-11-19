import { useState, useEffect } from "react";
import apiClient from "../api";
import Input from "../components/ui/Input";
import ProductoFormModal from "../components/ProductoFormModal";

function RegistrarVentaPage() {
  // --- Estados ---
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [itemsVenta, setItemsVenta] = useState([]);
  
  // Estados para el formulario
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);
  
  // Estados para la Búsqueda
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // Estados de mensajes
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  // Estados para Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState({});

  const fetchProductos = async () => {
    try {
      const response = await apiClient.get("/productos/");
      // Filtramos productos con stock > 0
      const conStock = response.data.filter(p => parseFloat(p.stock) > 0);
      setProductosDisponibles(conStock);
    } catch (error) {
      console.error("Error al obtener productos:", error);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  // Lógica de filtrado
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
    setTimeout(() => { setIsDropdownVisible(false); }, 150);
  };

  // --- AQUÍ ESTABA EL ERROR DE DECIMALES ---
  const handleAddItem = () => {
    if (!productoSeleccionado || cantidadSeleccionada <= 0) {
      setError("Por favor, selecciona un producto y cantidad válida.");
      return;
    }
    
    const prodId = parseInt(productoSeleccionado);
    // CAMBIO: Usamos parseFloat para permitir decimales (ej. 0.250)
    const cant = parseFloat(cantidadSeleccionada); 

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

  const handleRegistrarVenta = async () => {
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
      console.error("Error venta:", error.response?.data);
      if (error.response?.data?.detail) {
        setError(`Error: ${error.response.data.detail}`);
      } else {
        setError("Ocurrió un error desconocido.");
      }
    }
  };

  const totalVenta = itemsVenta.reduce(
    (acc, item) => acc + item.cantidad * item.precio_en_el_momento,
    0
  );

  // Funciones del Modal
  const handleAbrirModalCrear = () => {
    setModalInitialData({
      nombre: terminoBusqueda, codigo: "", precio_costo: "", precio_venta: "", stock: 0, stock_minimo: 0,
    });
    setIsCreateModalOpen(true);
    setIsDropdownVisible(false);
  };

  const handleModalSaveSuccess = (productoGuardado) => {
    setIsCreateModalOpen(false);
    fetchProductos();
    setItemsVenta((prevItems) => [
      ...prevItems,
      {
        producto: { id: productoGuardado.id, nombre: productoGuardado.nombre },
        cantidad: 1,
        precio_en_el_momento: productoGuardado.precio_venta,
      },
    ]);
    setTerminoBusqueda("");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Registrar Nueva Venta</h1>

      {error && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 p-3 rounded">{error}</div>}
      {exito && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 p-3 rounded">{exito}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Columna Izquierda */}
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
                        Código: {p.codigo || 'N/A'} - Stock: {parseFloat(p.stock)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div 
                    className="p-3 text-gray-500 cursor-pointer hover:bg-green-100"
                    onMouseDown={handleAbrirModalCrear}
                  >
                    No se encontró. <span className="font-semibold text-green-600">Crear "{terminoBusqueda}"...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-4">
            <Input
              label="Cantidad"
              id="cantidad"
              type="number"
              min="0.001"
              step="0.001" // CAMBIO: Permitir decimales en el input
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

        {/* Columna Derecha */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">2. Resumen de Venta</h2>
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
                itemsVenta.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Registrar Venta
            </button>
          </div>
        </div>
      </div>

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