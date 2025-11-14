import { Outlet, NavLink } from "react-router-dom";
import { useState } from "react";

// --- Íconos SVG que usaremos ---
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
const ToggleIcon = ({ isOpen }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
       className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "" : "rotate-180"}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
  </svg>
);
// ------------------------------

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navLinkClass = ({ isActive }) =>
    `flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 rounded-md mx-2 ${
      isActive ? "bg-blue-600 text-white font-semibold" : ""
    } ${isSidebarOpen ? "" : "justify-center"}`;

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
        </nav>

        <div className={`p-4 text-sm text-gray-400 border-t border-gray-700 ${isSidebarOpen ? "" : "text-center"}`}>
            <p className={`${isSidebarOpen ? "block" : "hidden"}`}>&copy; {new Date().getFullYear()} Alcorta</p>
            <p className={`${isSidebarOpen ? "hidden" : "block"}`}>&copy;{new Date().getFullYear()}</p>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;