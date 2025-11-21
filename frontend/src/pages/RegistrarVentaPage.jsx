import { useState, useEffect } from "react";
import apiClient from "../api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ProductoFormModal from "../components/ProductoFormModal";

// --- Íconos SVG ---
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0-.97-4.277M9 7.114V5.572m4.102.162L17 4m0 0l-4.102 2.162M12 4v16M8.7 10.5h6.6m-6.6 0-1.8 7.2M17 18.75V19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-.25" />
  </svg>
);
// ------------------

function RegistrarVentaPage() {
  // --- Estados Principales ---
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [itemsVenta, setItemsVenta] = useState([]); 
  
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // NUEVO ESTADO: Método de Pago (Por defecto Efectivo)
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");

  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState({});
  const [isEditQtyModalOpen, setIsEditQtyModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [newQty, setNewQty] = useState(1);

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

  useEffect(() => { fetchProductos(); }, []);

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

  const handleBlur = () => { setTimeout(() => { setIsDropdownVisible(false); }, 150); };

  const handleAddItem = () => {
    if (!productoSeleccionado || cantidadSeleccionada <= 0) {
      setError("Por favor, selecciona un producto y cantidad válida.");
      return;
    }
    const prodId = parseInt(productoSeleccionado);
    const cant = parseFloat(cantidadSeleccionada); // Soporte Decimal

    setError(null);
    const itemExistente = itemsVenta.find((item) => item.producto.id === prodId);

    if (itemExistente) {
      setItemsVenta((prevItems) =>
        prevItems.map((item) =>
          item.producto.id === prodId ? { ...item, cantidad: item.cantidad + cant } : item
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

  const handleRemoveItem = (productoId) => {
    setItemsVenta(itemsVenta.filter(item => item.producto.id !== productoId));
  };

  const handleOpenEditQty = (item) => {
    setItemToEdit(item);
    setNewQty(item.cantidad);
    setIsEditQtyModalOpen(true);
  };

  const handleSaveNewQty = (e) => {
    e.preventDefault();
    if (newQty <= 0) return;
    setItemsVenta((prevItems) => 
        prevItems.map(item => item.producto.id === itemToEdit.producto.id ? { ...item, cantidad: parseFloat(newQty) } : item)
    );
    setIsEditQtyModalOpen(false);
    setItemToEdit(null);
  };

  const handleRegistrarVenta = async () => {
    if (itemsVenta.length === 0) {
      setError("No puedes registrar una venta vacía.");
      return;
    }
    setError(null);
    setExito(null);
    
    const payload = {
      metodo_pago: metodoPago, // <-- ENVIAMOS EL MÉTODO DE PAGO
      items: itemsVenta.map((item) => ({
        producto: item.producto.id,
        cantidad: item.cantidad,
      })),
    };

    try {
      const response = await apiClient.post("/ventas/", payload);
      setExito(`¡Venta #${response.data.id} registrada! Total: $${response.data.total_venta}`);
      setItemsVenta([]); // Limpiar carrito
      setMetodoPago("EFECTIVO"); // Resetear pago
      fetchProductos(); // Actualizar stock
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

  const handleAbrirModalCrear = () => {
    setModalInitialData({ nombre: terminoBusqueda, codigo: "", precio_costo: "", precio_venta: "", stock: 0, stock_minimo: 0 });
    setIsCreateModalOpen(true);
    setIsDropdownVisible(false);
  };

  const handleModalSaveSuccess = (productoGuardado) => {
    setIsCreateModalOpen(false);
    fetchProductos();
    setItemsVenta((prevItems) => [...prevItems, {
        producto: { id: productoGuardado.id, nombre: productoGuardado.nombre },
        cantidad: 1,
        precio_en_el_momento: productoGuardado.precio_venta,
      }]);
    setTerminoBusqueda("");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Registrar Nueva Venta</h1>

      {error && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 p-3 rounded">{error}</div>}
      {exito && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 p-3 rounded">{exito}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Columna Izquierda */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit">
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
                    <div key={p.id} className="p-3 hover:bg-blue-100 cursor-pointer" onMouseDown={() => handleProductoClick(p)}>
                      <p className="font-semibold">{p.nombre}</p>
                      <p className="text-sm text-gray-600">Código: {p.codigo || 'N/A'} - Stock: {parseFloat(p.stock)}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-gray-500 cursor-pointer hover:bg-green-100" onMouseDown={handleAbrirModalCrear}>
                    No se encontró. <span className="font-semibold text-green-600">Crear "{terminoBusqueda}"...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-4">
            <Input label="Cantidad" id="cantidad" type="number" min="0.001" step="0.001" value={cantidadSeleccionada} onChange={(e) => setCantidadSeleccionada(e.target.value)} />
          </div>

          <button onClick={handleAddItem} className="w-full bg-blue-600 text-white p-2 rounded-md font-semibold hover:bg-blue-700 transition-colors">
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cant.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio U.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {itemsVenta.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.producto.nombre}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{parseFloat(item.cantidad)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">${item.precio_en_el_momento}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">${(item.cantidad * item.precio_en_el_momento).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm flex gap-2">
                        <button onClick={() => handleOpenEditQty(item)} className="text-blue-600 hover:text-blue-800 p-1"><PencilIcon /></button>
                        <button onClick={() => handleRemoveItem(item.producto.id)} className="text-red-600 hover:text-red-800 p-1"><TrashIcon /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {itemsVenta.length === 0 && <p className="text-gray-500 text-center py-10">El carrito está vacío.</p>}
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
                {/* --- SELECTOR DE MÉTODO DE PAGO --- */}
                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md">
                    <label className="text-sm font-bold text-gray-700">Método de Pago:</label>
                    <select 
                        value={metodoPago}
                        onChange={(e) => setMetodoPago(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer"
                    >
                        <option value="EFECTIVO">💵 Efectivo</option>
                        <option value="TRANSFERENCIA">💳 Transferencia</option>
                    </select>
                </div>
                
                <div className="text-2xl font-bold text-gray-800">Total: ${totalVenta.toFixed(2)}</div>
            </div>
            
            <button onClick={handleRegistrarVenta} disabled={itemsVenta.length === 0} className={`w-full text-white p-3 rounded-md font-bold text-lg transition-colors ${itemsVenta.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>
              Confirmar Venta
            </button>
          </div>
        </div>
      </div>

      <ProductoFormModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} mode="create" initialData={modalInitialData} onSaveSuccess={handleModalSaveSuccess} />
      <Modal isOpen={isEditQtyModalOpen} onClose={() => setIsEditQtyModalOpen(false)} title={`Editar cantidad`} footer={<><Button variant="secondary" onClick={() => setIsEditQtyModalOpen(false)}>Cancelar</Button><Button variant="primary" onClick={handleSaveNewQty}>Actualizar</Button></>}>
          <form onSubmit={handleSaveNewQty}><Input label="Nueva Cantidad" type="number" min="0.001" step="0.001" value={newQty} onChange={(e) => setNewQty(e.target.value)} autoFocus /></form>
      </Modal>
    </div>
  );
}

export default RegistrarVentaPage;