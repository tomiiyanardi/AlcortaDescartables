import { Outlet, NavLink, useNavigate } from "react-router-dom"; // <-- 1. Importamos useNavigate
import { useState } from "react";

// --- Íconos SVG ---
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v16.5h16.5M21 12.75V7.5M16.5 12.75v-1.5M12 12.75v-3M7.5 12.75v-4.5M3.75 17.25h16.5" />
  </svg>
);
const ProductosIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
  </svg>
);
const VentaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.612 0 1.17-.31 1.5-.796l1.07-1.953c.296-.54.296-1.192 0-1.732L17.25 8.25c-.329-.603-.988-.97-1.712-.97H7.5V3H2.25z" />
  </svg>
);
const HistorialIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18c-2.305 0-4.408.867-6 2.292m0-14.25v14.25" />
  </svg>
);
const CompraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.518 5.518-5.518-5.518m5.518 5.518L21.75 12M2.25 18v-5.172c0-.98.39-1.903 1.09-2.585l5.518-5.519c.702-.702 1.83-.702 2.532 0l5.518 5.519c.7.7 1.09 1.605 1.09 2.585V18M2.25 18h19.5" />
  </svg>
);
// --- 2. AÑADIMOS EL ÍCONO DE LOGOUT ---
const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
  </svg>
);
const ToggleIcon = ({ isOpen }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
       className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "" : "rotate-180"}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate(); // <-- 3. Inicializamos el hook

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 rounded-md mx-2 ${
      isActive ? "bg-blue-600 text-white font-semibold" : ""
    } ${isSidebarOpen ? "" : "justify-center"}`;

  // --- 4. CREAMOS LA FUNCIÓN DE LOGOUT ---
  const handleLogout = () => {
    // 1. Borramos el token (la "llave") de nuestro bolsillo
    localStorage.removeItem("authToken");
    // 2. Redirigimos al usuario a la página de login
    navigate("/login");
  };
  // ------------------------------------

  return (
    <div className="flex h-screen bg-gray-100">
      
      <div 
        className={`transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-20"} bg-gray-800 text-white shadow-lg flex flex-col relative`}
      >
        
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="absolute top-5 -right-3 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none z-10"
          title={isSidebarOpen ? "Minimizar" : "Expandir"}
        >
          <ToggleIcon isOpen={isSidebarOpen} />
        </button>
        
        <div className={`p-5 font-extrabold border-b border-gray-700 ${isSidebarOpen ? "text-2xl" : "text-xl text-center"}`}>
          {isSidebarOpen ? (
            <span className="text-blue-400">Alcorta</span>
          ) : (
            <span className="text-blue-400">A</span>
          )}
          <span className={`${isSidebarOpen ? "inline" : "hidden"}`}>Descartables</span>
        </div>

        <nav className="flex-1 mt-5 space-y-2">
          <NavLink to="/" className={navLinkClass} title="Dashboard">
            <DashboardIcon />
            <span className={`ml-3 ${isSidebarOpen ? "block" : "hidden"} whitespace-nowrap`}>Dashboard</span>
          </NavLink>
          <NavLink to="/productos" className={navLinkClass} title="Productos">
            <ProductosIcon />
            <span className={`ml-3 ${isSidebarOpen ? "block" : "hidden"} whitespace-nowrap`}>Productos</span>
          </NavLink>
          <NavLink to="/registrar-venta" className={navLinkClass} title="Registrar Venta">
            <VentaIcon />
            <span className={`ml-3 ${isSidebarOpen ? "block" : "hidden"} whitespace-nowrap`}>Registrar Venta</span>
          </NavLink>
          <NavLink to="/historial" className={navLinkClass} title="Historial de Ventas">
            <HistorialIcon />
            <span className={`ml-3 ${isSidebarOpen ? "block" : "hidden"} whitespace-nowrap`}>Historial de Ventas</span>
          </NavLink>
          <NavLink to="/registrar-compra" className={navLinkClass} title="Registrar Compra">
            <CompraIcon />
            <span className={`ml-3 ${isSidebarOpen ? "block" : "hidden"} whitespace-nowrap`}>Registrar Compra</span>
          </NavLink>
        </nav>

        {/* --- 5. AÑADIMOS EL BOTÓN DE LOGOUT --- */}
        <div className="p-2 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-700 hover:text-white transition-colors duration-200 rounded-md ${isSidebarOpen ? "" : "justify-center"}`}
            title="Cerrar Sesión"
          >
            <LogoutIcon />
            <span className={`ml-3 ${isSidebarOpen ? "block" : "hidden"} whitespace-nowrap`}>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;