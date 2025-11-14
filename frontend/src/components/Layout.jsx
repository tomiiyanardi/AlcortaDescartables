import { Outlet, NavLink } from "react-router-dom";

function Layout() {
  const navLinkClass = ({ isActive }) =>
    `block px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 ${
      isActive ? "bg-blue-600 text-white font-semibold" : ""
    }`;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white shadow-lg flex flex-col">
        <div className="p-5 text-2xl font-extrabold border-b border-gray-700">
          <span className="text-blue-400">Alcorta</span>Descartables
        </div>
        <nav className="flex-1 mt-5">
          {/* Usamos 'NavLink' para que la clase 'active' se aplique automáticamente */}
          <NavLink to="/" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/productos" className={navLinkClass}>
            Productos
          </NavLink>
          <NavLink to="/registrar-venta" className={navLinkClass}>
            Registrar Venta
          </NavLink>
          {/* Puedes añadir más enlaces aquí */}
        </nav>
        {/* Pie de página opcional en el sidebar */}
        <div className="p-4 text-sm text-gray-400 border-t border-gray-700">
            <p>&copy; {new Date().getFullYear()} AlcortaDescartables</p>
        </div>
      </div>

      {/* Área de Contenido Principal */}
      <div className="flex-1 p-8 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;