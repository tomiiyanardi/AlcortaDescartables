import { useState, useEffect } from "react";
import apiClient from "../api"; // Importamos nuestro cliente de API

function RegistrarVentaPage() {
  // --- Estados ---
  // 1. Lista de TODOS los productos (para el <select>)
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  
  // 2. El "carrito" (los items de la venta actual)
  const [itemsVenta, setItemsVenta] = useState([]);
  
  // 3. Para manejar el <select> y el input de cantidad
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [cantidadSeleccionada, setCantidadSeleccionada] = useState(1);

  // 4. Mensajes de estado (éxito o error)
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  // --- 1. FUNCIÓN PARA CARGAR PRODUCTOS (GET) ---
  // Carga la lista de productos disponibles para vender
  const fetchProductos = async () => {
    try {
      const response = await apiClient.get("/productos/");
      // Filtramos productos con stock > 0
      const conStock = response.data.filter(p => p.stock > 0);
      setProductosDisponibles(conStock);
      // Seleccionamos el primero por defecto
      if (conStock.length > 0) {
        setProductoSeleccionado(conStock[0].id);
      }
    } catch (error) {
      console.error("Error al obtener productos:", error);
    }
  };

  // --- 2. useEffect PARA CARGAR PRODUCTOS AL INICIO ---
  useEffect(() => {
    fetchProductos();
  }, []); // Se ejecuta solo una vez

  // --- 3. FUNCIÓN PARA AÑADIR ITEM AL CARRITO ---
  const handleAddItem = () => {
    if (!productoSeleccionado || cantidadSeleccionada <= 0) {
      setError("Por favor, selecciona un producto y una cantidad válida.");
      return;
    }

    // Convertir a número
    const prodId = parseInt(productoSeleccionado);
    const cant = parseInt(cantidadSeleccionada);

    // Revisar si el producto ya está en el carrito
    const itemExistente = itemsVenta.find((item) => item.producto.id === prodId);

    if (itemExistente) {
      // Si ya existe, actualiza la cantidad (lógica simple)
      setError("Ese producto ya está en el carrito. (Próximamente: editar cantidad)");
      return; // (Podríamos implementar la suma de cantidades aquí)
    }

    // Traer los detalles del producto (nombre, precio) para mostrar
    const producto = productosDisponibles.find((p) => p.id === prodId);

    // Añadir al carrito
    setItemsVenta((prevItems) => [
      ...prevItems,
      {
        producto: { id: producto.id, nombre: producto.nombre },
        cantidad: cant,
        precio_en_el_momento: producto.precio_venta,
      },
    ]);

    // Limpiar inputs
    setCantidadSeleccionada(1);
    setError(null);
  };

  // --- 4. FUNCIÓN PARA ENVIAR LA VENTA (POST) ---
  const handleRegistrarVenta = async () => {
    if (itemsVenta.length === 0) {
      setError("No puedes registrar una venta vacía.");
      return;
    }

    // Limpiar mensajes
    setError(null);
    setExito(null);

    // Formatear los datos para la API (solo ID de producto y cantidad)
    const payload = {
      items: itemsVenta.map((item) => ({
        producto: item.producto.id,
        cantidad: item.cantidad,
      })),
    };

    try {
      // Enviamos la petición POST
      const response = await apiClient.post("/ventas/", payload);
      
      // Si tiene éxito (201 Created):
      setExito(`¡Venta #${response.data.id} registrada! Total: $${response.data.total_venta}`);
      
      // Limpiar todo
      setItemsVenta([]);
      
      // Recargar la lista de productos (para actualizar el stock visible)
      fetchProductos();

    } catch (error) {
      // ¡Aquí capturamos el error de "Falta de Stock" del backend!
      console.error("Error al registrar la venta:", error.response.data);
      if (error.response && error.response.data && error.response.data.detail) {
        setError(`Error: ${error.response.data.detail}`);
      } else {
        setError("Ocurrió un error desconocido.");
      }
    }
  };

  // --- 5. Cálculo del Total (para mostrarlo) ---
  const totalVenta = itemsVenta.reduce(
    (acc, item) => acc + item.cantidad * item.precio_en_el_momento,
    0
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Registrar Nueva Venta</h1>

      {/* --- MENSAJES DE ERROR/ÉXITO --- */}
      {error && <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">{error}</div>}
      {exito && <div className="mb-4 bg-green-100 text-green-700 p-3 rounded">{exito}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Columna Izquierda: Añadir Productos */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">1. Añadir Productos</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
            <select
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {productosDisponibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
            <input
              type="number"
              min="1"
              value={cantidadSeleccionada}
              onChange={(e) => setCantidadSeleccionada(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>

          <button
            onClick={handleAddItem}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Añadir al Carrito
          </button>
        </div>

        {/* Columna Derecha: Resumen de Venta */}
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
                    <td className="px-6 py-4">{item.producto.nombre}</td>
                    <td className="px-6 py-4">{item.cantidad}</td>
                    <td className="px-6 py-4">${item.precio_en_el_momento}</td>
                    <td className="px-6 py-4">${(item.cantidad * item.precio_en_el_momento).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {itemsVenta.length === 0 && (
              <p className="text-gray-500 text-center py-10">El carrito está vacío.</p>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="text-2xl font-bold text-right mb-4">
              Total: ${totalVenta.toFixed(2)}
            </div>
            <button
              onClick={handleRegistrarVenta}
              disabled={itemsVenta.length === 0}
              className={`w-full text-white p-3 rounded font-bold ${
                itemsVenta.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
              }`}
            >
              Registrar Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegistrarVentaPage;