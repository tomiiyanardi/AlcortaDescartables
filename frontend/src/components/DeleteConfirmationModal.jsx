import Modal from "./Modal";
import Button from "./Button";

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || "Confirmar Eliminación"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Eliminar
          </Button>
        </>
      }
    >
      <div className="text-gray-700">
        <p>{message || "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer."}</p>
      </div>
    </Modal>
  );
}

export default DeleteConfirmationModal;