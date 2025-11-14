import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Para redirigir al usuario
import apiClient from "../api";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Hook para redirigir

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // 1. Enviamos el usuario/contraseña al endpoint /api/login/
      const response = await apiClient.post("/login/", {
        username: username,
        password: password,
      });
      
      // 2. Si es exitoso, response.data contendrá el token
      const token = response.data.token;
      
      // 3. Guardamos el token en el localStorage del navegador
      // Esto es como guardar la "llave" en nuestro bolsillo
      localStorage.setItem("authToken", token);

      // 4. Redirigimos al usuario al Dashboard (la app principal)
      navigate("/");

    } catch (err) {
      // 5. Si falla (usuario/contraseña incorrecta)
      console.error("Error de login:", err.response.data);
      setError("Usuario o contraseña incorrectos.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          <span className="text-blue-600">Alcorta</span>Descartables
        </h1>
        <h2 className="text-xl font-semibold text-center text-gray-600 mb-6">
          Iniciar Sesión
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Usuario"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
          <Input
            label="Contraseña"
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          
          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full">
            Ingresar
          </Button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;