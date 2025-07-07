import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import './NavBarForm.css';
import { API_ENDPOINTS } from '../../config/api';

const NavBar = () => {
  const navigate = useNavigate();
  const [nuevasNotas, setNuevasNotas] = useState(0); // Estado para la cantidad de notas no leídas
  
  useEffect(() => {
    const fetchNotas = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.NOTAS);
        // Contar las notas no leídas
        const cantidadNotasNoLeidas = response.data.filter(nota => !nota.leida).length;
        setNuevasNotas(cantidadNotasNoLeidas);
      } catch (error) {
        console.error("Error al obtener las notas:", error);
      }
    };
    
    fetchNotas();
    
    // Configurar un intervalo para verificar nuevas notas periódicamente
    const intervalo = setInterval(fetchNotas, 60000); // Verificar cada minuto
    
    // Limpiar intervalo al desmontar el componente
    return () => clearInterval(intervalo);
  }, []); // Ejecutar solo al montar el componente
  
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
        <span className="material-icons mr-2">
          <a href="/admin" className="text-white no-underline">Drugstore LaMendoza</a>
        </span>
      </div>
      
      {/* Opciones del menú */}
      <ul className="flex space-x-4">
        <li>
          <a href="/proveedores" className="text-white hover:text-yellow-900 transition">
            Proveedores
          </a>
        </li>
        <li>
          <a href="/inventario" className="text-white hover:text-yellow-900 transition">
            Inventario
          </a>
        </li>
        <li>
          <a href="/promociones" className="text-white hover:text-yellow-900 transition">
            Promociones
          </a>
        </li>
        <li>
          <a href="/bajas" className="text-white hover:text-yellow-900 transition">
            Bajas
          </a>
        </li>
        <li>
          <a href="/ventas" className="text-white hover:text-yellow-900 transition">
            Ver Ventas
          </a>
        </li>
        <li>
          <a href="/embutidos" className="text-white hover:text-yellow-900 transition">
            Embutidos
          </a>
        </li>
        <li>
          <a href="/caja" className="text-white hover:text-yellow-900 transition">
            Caja
          </a>
        </li>
        <li>
          <a href="/rendimiento" className="text-white hover:text-yellow-900 transition">
            Rendimiento
          </a>
        </li>
        <li>
          <a href="/notasAdmin" className="text-white hover:text-yellow-900 transition">
            Notas
            {nuevasNotas > 0 && (
              <span className="nueva-nota-indicador">
                {nuevasNotas}
              </span>
            )}
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

export default NavBar;