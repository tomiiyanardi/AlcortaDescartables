import { useState, useEffect } from "react";
import apiClient from "../api";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";

function EditarVentaModal({ isOpen, onClose, venta, onSaveSuccess }) {
  // Estado para los items de la venta (carrito de edición)
  const [items, setItems] = useState([]);
  
  // Estados para el buscador (para agregar nuevos productos)
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [error, setError] = useState(null);

  // Cargar productos al inicio (para el buscador)
  useEffect(() => {
    if (isOpen) {
      apiClient.get("/productos/").then((res) => {
        setProductosDisponibles(res.data.filter((p) => p.stock > 0));
      });
      
      // Cargar los items de la venta actual
      if (venta) {
        // Transformamos la estructura para que sea fácil de editar
        // La API devuelve { producto_nombre: "...", cantidad: 1, precio... }
        // Necesitamos guardar el ID del producto para enviarlo de vuelta
        // PERO la API de lectura (VentaSerializer) no nos da el ID del producto en 'items', 
        // solo el nombre. ¡Necesitamos el ID! 
        
        // TRUCO: Como ya cargamos "productosDisponibles", podemos buscar el ID por el nombre 
        // O mejor, confiamos en que el backend nos mande el ID.
        // (Nota: Si el backend ItemVentaSerializer no tiene 'producto' (id), esto fallaría.
        // Asumamos por ahora que solo editamos cantidad, o añadimos nuevos).
        
        // Mapeo inicial simple
        setItems(venta.items.map(i => ({
            // Intentamos recuperar el ID del producto si viniera, sino usamos nombre para mostrar
            productoId: i.producto, // <-- Asegúrate que ItemVentaSerializer en backend tenga 'producto' (el ID)
            nombre: i.producto_nombre,
            cantidad: i.cantidad,
            precio: i.precio_en_el_momento
        })));
      }
    }
  }, [isOpen, venta]);

  // --- Lógica de Buscador ---
  const productosFiltrados = productosDisponibles.filter(p =>
    p.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase())
  );

  const handleAgregarProducto = (producto) => {
    // Verificar si ya está
    const existe = items.find(i => i.productoId === producto.id);
    if (existe) {
        setError("El producto ya está en la lista. Modifica su cantidad abajo.");
    } else {
        setItems([...items, {
            productoId: producto.id,
            nombre: producto.nombre,
            cantidad: 1,
            precio: producto.precio_venta
        }]);
        setTerminoBusqueda("");
        setIsDropdownVisible(false);
    }
  };

  // --- Lógica de Edición ---
  const handleCantidadChange = (index, nuevaCantidad) => {
    const nuevosItems = [...items];
    nuevosItems[index].cantidad = parseInt(nuevaCantidad);
    setItems(nuevosItems);
  };

  const handleEliminarItem = (index) => {
    const nuevosItems = [...items];
    nuevosItems.splice(index, 1);
    setItems(nuevosItems);
  };

  const handleGuardar = async () => {
    setError(null);
    // Preparar payload
    const payload = {
        items: items.map(i => ({
            producto: i.productoId, // Enviamos el ID
            cantidad: i.cantidad
        }))
    };

    try {
        await apiClient.put(`/ventas/${venta.id}/`, payload);
        onSaveSuccess();
        onClose();
    } catch (err) {
        console.error(err);
        setError("Error al guardar. Verifica el stock.");
    }
  };

  // Cálculo total visual
  const total = items.reduce((acc, i) => acc + (i.cantidad * i.precio), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Venta #${venta?.id}`} footer={null}>
      <div className="space-y-4">
        
        {/* Buscador para añadir */}
        <div className="relative">
            <Input 
                placeholder="Agregar producto extra..." 
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                onFocus={() => setIsDropdownVisible(true)}
                onBlur={() => setTimeout(() => setIsDropdownVisible(false), 200)}
            />
            {isDropdownVisible && terminoBusqueda && (
                <div className="absolute z-10 w-full bg-white border mt-1 max-h-40 overflow-y-auto shadow-lg">
                    {productosFiltrados.map(p => (
                        <div key={p.id} className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={() => handleAgregarProducto(p)}>
                            {p.nombre}
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
                                    type="number" min="1" 
                                    className="w-16 p-1 border rounded"
                                    value={item.cantidad}
                                    onChange={(e) => handleCantidadChange(idx, e.target.value)}
                                />
                            </td>
                            <td className="py-2">${(item.cantidad * item.precio).toFixed(2)}</td>
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

        <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleGuardar}>Guardar Cambios</Button>
        </div>
      </div>
    </Modal>
  );
}

export default EditarVentaModal;