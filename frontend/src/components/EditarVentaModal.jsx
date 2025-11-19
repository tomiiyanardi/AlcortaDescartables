// frontend/src/components/EditarVentaModal.jsx
import { useState, useEffect } from "react";
import apiClient from "../api";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";

function EditarVentaModal({ isOpen, onClose, venta, onSaveSuccess }) {
  const [items, setItems] = useState([]);
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [error, setError] = useState(null);

  // Cargar productos al inicio (para el buscador)
  useEffect(() => {
    if (isOpen) {
      // 1. Cargar la lista de productos disponibles (para el buscador)
      apiClient.get("/productos/").then((res) => {
        setProductosDisponibles(res.data);
      });
      
      // 2. Cargar los items de la venta actual
      if (venta && venta.items) {
        setItems(venta.items.map(i => ({
            productoId: i.producto, // Asumimos que ItemVentaSerializer nos da el ID
            nombre: i.producto_nombre,
            cantidad: i.cantidad,
            precio: i.precio_en_el_momento
        })));
      }
      setTerminoBusqueda("");
      setError(null);
    }
  }, [isOpen, venta]);

  // --- Lógica de Buscador ---
  const productosFiltrados = productosDisponibles.filter(p =>
    p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase())
  );

  const handleAgregarProducto = (producto) => {
    setError(null);
    const itemIndex = items.findIndex(i => i.productoId === producto.id);

    if (itemIndex > -1) {
        // Si ya existe, incrementamos la cantidad
        setItems(items.map((item, idx) => 
            idx === itemIndex ? { ...item, cantidad: parseFloat(item.cantidad) + 1 } : item
        ));
    } else {
        // Si no existe, agregamos uno nuevo
        setItems([...items, {
            productoId: producto.id,
            nombre: producto.nombre,
            cantidad: 1,
            precio: producto.precio_venta
        }]);
    }
    setTerminoBusqueda("");
    setIsDropdownVisible(false);
  };

  // --- Lógica de Edición ---
  const handleCantidadChange = (index, nuevaCantidad) => {
    const value = parseFloat(nuevaCantidad) || 0;
    const nuevosItems = [...items];
    nuevosItems[index].cantidad = value;
    setItems(nuevosItems);
  };

  const handleEliminarItem = (index) => {
    const nuevosItems = [...items];
    nuevosItems.splice(index, 1);
    setItems(nuevosItems);
  };

  const handleGuardar = async () => {
    setError(null);
    const itemsValidos = items.filter(i => i.cantidad > 0);

    if (itemsValidos.length === 0) {
        setError("La venta no puede estar vacía.");
        return;
    }

    // Preparar payload para la API (usando Decimales)
    const payload = {
        items: itemsValidos.map(i => ({
            producto: i.productoId,
            cantidad: parseFloat(i.cantidad).toFixed(2) // Aseguramos 2 decimales para el backend
        }))
    };

    try {
        await apiClient.put(`/ventas/${venta.id}/`, payload);
        onSaveSuccess(); // Llama al recargador de la tabla principal
        onClose();
    } catch (err) {
        console.error("Error de edición:", err.response);
        setError(err.response.data?.detail || "Error al guardar. Verifica el stock.");
    }
  };

  // Cálculo total visual
  const total = items.reduce((acc, i) => acc + (parseFloat(i.cantidad) * i.precio), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Venta #${venta?.id}`} footer={null}>
      <div className="space-y-4">
        
        {/* Buscador para añadir items a la venta */}
        <div className="relative">
            <Input 
                placeholder="Buscar y Agregar producto..." 
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                onFocus={() => setIsDropdownVisible(true)}
                onBlur={() => setTimeout(() => setIsDropdownVisible(false), 200)}
            />
            {isDropdownVisible && terminoBusqueda && (
                <div className="absolute z-10 w-full bg-white border mt-1 max-h-40 overflow-y-auto shadow-lg">
                    {productosFiltrados.map(p => (
                        <div key={p.id} className="p-2 hover:bg-blue-100 cursor-pointer" onMouseDown={() => handleAgregarProducto(p)}>
                            {p.nombre} (Stock: {p.stock})
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Lista de Items */}
        <div className="max-h-60 overflow-y-auto border rounded p-2">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left border-b">
                        <th className="pb-2">Producto</th>
                        <th className="pb-2 w-20">Cant.</th>
                        <th className="pb-2">Subtotal</th>
                        <th className="pb-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                            <td className="py-2">{item.nombre}</td>
                            <td className="py-2">
                                <input 
                                    type="number" min="0.01" step="any"
                                    className="w-16 p-1 border rounded"
                                    value={item.cantidad}
                                    onChange={(e) => handleCantidadChange(idx, e.target.value)}
                                />
                            </td>
                            <td className="py-2">${(parseFloat(item.cantidad) * item.precio).toFixed(2)}</td>
                            <td className="py-2 text-right">
                                <button onClick={() => handleEliminarItem(idx)} className="text-red-500 font-bold">X</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        
        <div className="text-right font-bold text-xl">Total: ${total.toFixed(2)}</div>
        
        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end gap-2 pt-2 border-t mt-4">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleGuardar}>Guardar Cambios</Button>
        </div>
      </div>
    </Modal>
  );
}

export default EditarVentaModal;