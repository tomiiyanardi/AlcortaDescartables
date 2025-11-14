import { useState, useEffect } from "react";
import apiClient from "../api";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";

const VALORES_INICIALES = {
  nombre: "",
  codigo: "",
  precio_costo: "",
  precio_venta: "",
  stock: 0,
  stock_minimo: 0,
};

/**
 * Este componente maneja tanto la Creación como la Edición de un Producto.
 *
 * Props:
 * - isOpen: (boolean) Controla si el modal está abierto.
 * - onClose: (function) Función para cerrar el modal.
 * - mode: ("create" | "edit") Define el modo del formulario.
 * - initialData: (object) Los datos del producto para 'edit', o un objeto con
 * valores por defecto (ej. { nombre: '...'}) para 'create'.
 * - onSaveSuccess: (function) Callback que se ejecuta al guardar, 
 * devuelve el producto (nuevo o editado).
 */
function ProductoFormModal({ isOpen, onClose, mode, initialData = VALORES_INICIALES, onSaveSuccess }) {
  const [formData, setFormData] = useState(initialData);
  const [error, setError] = useState(null);

  // Sincroniza el formulario si los datos iniciales cambian (ej. al abrir el modal)
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setError(null);
    }
  }, [isOpen, initialData]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const url = (mode === 'edit')
      ? `/productos/${initialData.id}/` // 'initialData' tiene el ID en modo 'edit'
      : "/productos/";

    const method = (mode === 'edit') ? 'put' : 'post';

    try {
      const response = await apiClient[method](url, formData);
      onSaveSuccess(response.data); // Devuelve el producto guardado
      onClose(); // Cierra el modal

    } catch (error) {
      console.error("Error al guardar el producto:", error.response?.data);
      if (error.response?.data) {
        const errorMsg = Object.values(error.response.data).join('; ');
        setError(`Error: ${errorMsg}`);
      } else {
        setError("Error al guardar. Revise los campos.");
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? "Añadir Nuevo Producto" : "Editar Producto"}
      footer={null} // El footer lo ponemos dentro del form
    >
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

        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit">
            {mode === 'create' ? "Guardar Producto" : "Guardar Cambios"}
          </Button>
        </div>

      </form>
    </Modal>
  );
}

export default ProductoFormModal;