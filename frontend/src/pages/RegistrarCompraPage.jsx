import { useState, useEffect } from "react";
import apiClient from "../api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ProductoFormModal from "../components/ProductoFormModal";

function RegistrarCompraPage() {
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState({});

  const fetchProductos = async () => {
    try {
      const response = await apiClient.get("/productos/");
      setProductos(response.data);
    } catch (error) {
      console.error("Error al obtener productos:", error);
    }
  };

  useEffect(() => { fetchProductos(); }, []);

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
    (p.codigo && p.codigo.toLowerCase().includes(terminoBusqueda.toLowerCase()))
  );

  const handleBusquedaChange = (e) => {
    setTerminoBusqueda(e.target.value);
    setProductoSeleccionado(null);
    setIsDropdownVisible(true);
  };

  const handleProductoClick = (producto) => {
    setProductoSeleccionado(producto);
    setTerminoBusqueda(producto.nombre);
    setIsDropdownVisible(false);
  };

  const handleBlur = () => { setTimeout(() => { setIsDropdownVisible(false); }, 150); };

  const handleAddStock = async () => {
    // Validación con parseFloat
    const cant = parseFloat(cantidad);
    if (!productoSeleccionado || cant <= 0) {
      setError("Por favor, selecciona un producto y una cantidad positiva.");
      return;
    }
    setError(null);
    setExito(null);

    try {
      const response = await apiClient.post(
        `/productos/${productoSeleccionado.id}/add-stock/`, 
        { cantidad: cant } // Enviamos decimal
      );
      setExito(`Stock añadido. Nuevo stock de "${response.data.nombre}": ${parseFloat(response.data.stock)}`);
      fetchProductos();
      setProductoSeleccionado(null);
      setTerminoBusqueda("");
      setCantidad(1);
    } catch (error) {
      console.error("Error al añadir stock:", error.response?.data);
      setError("Error al añadir stock.");
    }
  };

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
    setProductoSeleccionado(productoGuardado);
    setTerminoBusqueda(productoGuardado.nombre);
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Registrar Compra / Añadir Stock</h1>

      {error && <div className="mb-4 bg-red-100 border border-red-400 text-red-700 p-3 rounded">{error}</div>}
      {exito && <div className="mb-4 bg-green-100 border border-green-400 text-green-700 p-3 rounded">{exito}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Añadir stock a producto existente</h2>
          
          <div className="mb-4 relative">
            <Input
              label="1. Buscar Producto"
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
                        Código: {p.codigo || 'N/A'} - Stock actual: {parseFloat(p.stock)}
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
              label="2. Cantidad a Añadir"
              id="cantidad"
              type="number"
              min="0.001" 
              step="0.001" // CAMBIO: Decimales permitidos
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              disabled={!productoSeleccionado}
            />
          </div>

          <Button onClick={handleAddStock} disabled={!productoSeleccionado || cantidad <= 0} variant="success">
            Añadir Stock
          </Button>

          {productoSeleccionado && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="font-semibold">{productoSeleccionado.nombre}</p>
              <p className="text-sm text-gray-600">Stock actual: {parseFloat(productoSeleccionado.stock)}</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Crear un producto nuevo</h2>
          <p className="text-gray-600 mb-4">
            Si el producto no existe, puedes crearlo desde cero aquí.
          </p>
          <Button onClick={() => handleAbrirModalCrear()} variant="primary">
            Crear Nuevo Producto
          </Button>
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

export default RegistrarCompraPage;