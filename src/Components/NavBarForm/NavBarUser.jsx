import React from "react";
import { useNavigate } from "react-router-dom";
import Swal from 'sweetalert2';
import './NavBarForm.css';

const NavBarUser = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Mostrar diálogo de confirmación con SweetAlert2
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro de que deseas cerrar sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b', // Color amarillo para combinar con el tema
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      // Si el usuario confirma, cerrar sesión
      if (result.isConfirmed) {
        // Eliminar el estado de inicio de sesión de localStorage
        localStorage.removeItem('isLoggedIn');
        // Redirigir al usuario a la página de inicio de sesión
        navigate('/', { replace: true });
      }
    });
  };

  return (
    <nav className="bg-yellow-500 p-4 shadow-md flex justify-between items-center">
      {/* Logo del kiosco */}
      <div className="text-white font-bold text-xl flex items-center">
        <span className="material-icons mr-2">Drugstore</span>
        LaMendoza
      </div>

      {/* Opciones del menú */}
      <ul className="flex space-x-4">
        <li>
          <a href="/user" className="text-white hover:text-yellow-900 transition">
            Inicio
          </a>
        </li>
        <li>
          <a href="/inventarioUser" className="text-white hover:text-yellow-900 transition">
            Inventario
          </a>
        </li>
        <li>
          <a href="/perdidas" className="text-white hover:text-yellow-900 transition">
            Bajas
          </a>
        </li>
        <li>
          <a href="/ventasUser" className="text-white hover:text-yellow-900 transition">
             Ventas
          </a>
        </li>
        <li>
          <a href="/embutidosUser" className="text-white hover:text-yellow-900 transition">
            Embutidos
          </a>
        </li>
        <li>
          <a href="/notas" className="text-white hover:text-yellow-900 transition">
            Notas
          </a>
        </li>
        <li>
          <button 
            onClick={handleLogout} 
            className="text-white hover:text-yellow-900 transition focus:outline-none move-right">
            Cerrar Sesión
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default NavBarUser;