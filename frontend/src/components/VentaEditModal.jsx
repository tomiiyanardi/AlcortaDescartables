import { useState, useEffect } from "react";
import apiClient from "../api";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";

function VentaEditModal({ isOpen, onClose, venta, onSaveSuccess }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  
  // Para añadir nuevos productos
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [prodSeleccionado, setProdSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  // Cargar productos al abrir
  useEffect(() => {
    if (isOpen) {
      apiClient.get("/productos/").then(res => setProductosDisponibles(res.data));
      // Convertir los items de la venta al formato editable
      if (venta) {
        const itemsFormato = venta.items.map(i => ({
          producto: { id: i.producto || i.producto_id, nombre: i.producto_nombre }, // Ajustar según tu API
          cantidad: parseFloat(i.cantidad),
          precio: parseFloat(i.precio_en_el_momento)
        }));
        setItems(itemsFormato);
      }
    }
  }, [isOpen, venta]);

  // Buscar productos
  const productosFiltrados = productosDisponibles.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleAddItem = () => {
    if (!prodSeleccionado) return;
    const cant = parseFloat(cantidad);
    
    // Verificar si ya está en la lista para sumar
    const existe = items.find(i => i.producto.id === prodSeleccionado.id);
    if (existe) {
      setItems(items.map(i => i.producto.id === prodSeleccionado.id ? {...i, cantidad: i.cantidad + cant} : i));
    } else {
      setItems([...items, {
        producto: prodSeleccionado,
        cantidad: cant,
        precio: prodSeleccionado.precio_venta
      }]);
    }
    setProdSeleccionado(null);
    setBusqueda("");
    setCantidad(1);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSave = async () => {
    if (items.length === 0) {
      setError("La venta debe tener al menos un producto.");
      return;
    }
    setError(null);

    // Formato para el backend: { items: [ { producto: ID, cantidad: N } ] }
    const payload = {
      items: items.map(i => ({
        producto: i.producto.id, // Enviamos solo el ID
        cantidad: i.cantidad
      }))
    };

    try {
      await apiClient.put(`/ventas/${venta.id}/`, payload);
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error al guardar cambios. Verifica el stock.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Venta #${venta?.id}`} footer={null}>
      <div className="space-y-4">
        
        {/* Buscador para añadir más cosas */}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
             <Input label="Añadir Producto" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..." />
             {busqueda && !prodSeleccionado && (
               <div className="absolute w-full bg-white border mt-1 max-h-40 overflow-y-auto z-10">
                 {productosFiltrados.map(p => (
                   <div key={p.id} className="p-2 hover:bg-gray-100 cursor-pointer" 
                        onClick={() => { setProdSeleccionado(p); setBusqueda(p.nombre); }}>
                     {p.nombre}
                   </div>
                 ))}
               </div>
             )}
          </div>
          <div className="w-20">
            <Input label="Cant." type="number" step="0.001" value={cantidad} onChange={e => setCantidad(e.target.value)} />
          </div>
          <Button onClick={handleAddItem} disabled={!prodSeleccionado}>+</Button>
        </div>

        {/* Lista de Items */}
        <div className="border rounded p-2 max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b"><th className="pb-2">Producto</th><th>Cant.</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  <td className="py-2">{item.producto.nombre}</td>
                  <td className="py-2">{item.cantidad}</td>
                  <td className="py-2 text-right">
                    <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">Quit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>Guardar Cambios</Button>
        </div>
      </div>
    </Modal>
  );
}

export default VentaEditModal;