import React, { useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Importa tus componentes
import LoginForm from "./Components/LoginForm/LoginForm";
import AdminPage from "./Components/AdminForm/AdminForm";
import UserForm from "./Components/UserForm/UserForm";
import Productos from "./Components/AdminForm/Productos";
import Ventas from "./Components/AdminForm/ventas";
import FlujoCaja from "./Components/AdminForm/flujoCaja";
import Inventario from "./Components/UserForm/inventarioUser";
import VentasUser from "./Components/UserForm/ventasUser";
import NotasAdmin from "./Components/AdminForm/notasAdmin";
import NotasUser from "./Components/UserForm/notasUser";
import EmbutidosAdmin from "./Components/AdminForm/EmbutidosAdmin";
import EmbutidosUser from "./Components/UserForm/embutidosUser";
import RendimientoDashboard from "./Components/AdminForm/rendimientoDashboard";
import Bajas from "./Components/AdminForm/Bajas";
import BajasUser from "./Components/UserForm/BajasUser";
import Proveedores from "./Components/AdminForm/Proveedores";
import Promociones from "./Components/AdminForm/Promociones";

function App() {
  useEffect(() => {
    // Prevenir navegación hacia atrás
    window.history.pushState(null, null, window.location.pathname);

    const handlePopState = (event) => {
      window.history.pushState(null, null, window.location.pathname);
      // Opcional: Mostrar un mensaje al usuario
      alert('No se permite retroceder en esta aplicación');
    };

    window.addEventListener('popstate', handlePopState);

    const handleKeyDown = (event) => {
      if (event.key === 'Backspace' && 
          event.target.tagName !== 'INPUT' && 
          event.target.tagName !== 'TEXTAREA') {
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Limpieza de eventos cuando el componente se desmonte
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas que no necesitan el BalanceContext */}
        <Route path="/" element={<LoginForm />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/user" element={<UserForm />} />
        <Route path="/inventario" element={<Productos />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/Caja" element={<FlujoCaja />} />
        <Route path="/inventarioUser" element={<Inventario />} />
        <Route path="/ventasUser" element={<VentasUser />} />
        <Route path="/notasAdmin" element={<NotasAdmin />} />
        <Route path="/notas" element={<NotasUser />} />
        <Route path="/embutidos" element={<EmbutidosAdmin />} />
        <Route path="/embutidosUser" element={<EmbutidosUser />} />
        <Route path="/rendimiento" element={<RendimientoDashboard />} />
        <Route path="/bajas" element={<Bajas />} />
        <Route path="/perdidas" element={<BajasUser />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route path="/promociones" element={<Promociones />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
