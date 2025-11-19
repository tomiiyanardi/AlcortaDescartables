// frontend/src/components/ui/DeleteConfirmationModal.jsx
import Modal from "./Modal";
import Button from "./Button";

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={null}>
      <p className="mb-4 text-gray-700">{message}</p>
      <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Eliminar
        </Button>
      </div>
    </Modal>
  );
}

export default DeleteConfirmationModal;