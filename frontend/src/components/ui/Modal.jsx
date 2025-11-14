import ReactDOM from 'react-dom';
import Button from './Button'; // Importa el botón que acabamos de crear

function Modal({ isOpen, onClose, title, children, footer = null }) {
  if (!isOpen) return null;

  // El portal asegura que el modal se renderice directamente en el body,
  // fuera de la jerarquía normal de la aplicación, para que siempre esté "encima".
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay oscuro de fondo */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Contenido del Modal */}
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 z-50 transform transition-all sm:my-8 sm:align-middle">
        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="mb-4">
          {children}
        </div>

        {/* Pie de Modal (Opcional) */}
        {footer && (
          <div className="pt-4 border-t border-gray-200 flex justify-end space-x-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body // ¡Renderiza el modal directamente en el <body> del HTML!
  );
}

export default Modal;