// src/config/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Crear instancia de axios con interceptor
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  
  console.log('🔍 DEBUG - Token encontrado:', token ? 'SÍ' : 'NO');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('🔍 DEBUG - Header Authorization:', config.headers.Authorization);
  }
  
  console.log('🔍 DEBUG - URL completa:', config.baseURL + config.url);
  
  return config;
});

// Interceptor de respuesta para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🚨 ERROR de respuesta:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      console.error('🚨 Token expirado o inválido');
      localStorage.removeItem('token');
      
      // Evitar loops infinitos
      if (window.location.pathname !== '/login') {
        alert('Tu sesión ha expirado. Serás redirigido al login.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  // Usuarios - CORREGIDO
  USERS: `${API_BASE_URL}/api/users`,
  REGISTER: `${API_BASE_URL}/api/register`,
  LOGIN: `${API_BASE_URL}/api/login`,
  LOGOUT: `${API_BASE_URL}/api/logout`,
  PROFILE: `${API_BASE_URL}/api/profile`,
  
  // Productos
  PRODUCTOS: `${API_BASE_URL}/api/productos`,
  PRODUCTOS_BAJO_STOCK: `${API_BASE_URL}/api/productos/bajo-stock`,
  CONSULTAR_STOCK: `${API_BASE_URL}/api/productos/consultar-stock`,
  
  // Ventas
  VENTAS: `${API_BASE_URL}/api/ventas`,
  VENTAS_EMBUTIDOS: `${API_BASE_URL}/api/ventas-embutidos`,
  
  // Embutidos
  EMBUTIDOS: `${API_BASE_URL}/api/embutidos`,
  
  // Promociones
  PROMOCIONES: `${API_BASE_URL}/api/promociones`,
  PROMOCIONES_ESTADISTICAS: `${API_BASE_URL}/api/promociones/estadisticas`,
  PROMOCIONES_ESTADISTICAS_COMPLETAS: `${API_BASE_URL}/api/promociones/estadisticas-completas`,
  
  // Notas
  NOTAS: `${API_BASE_URL}/api/notas`,
  NOTAS_NUEVAS: `${API_BASE_URL}/api/notas/nuevas`,
  
  // Caja
  CAJA: `${API_BASE_URL}/api/caja`,
  
  // Bajas
  BAJAS: `${API_BASE_URL}/api/bajas`,
  BAJAS_ESTADISTICAS: `${API_BASE_URL}/api/bajas/estadisticas`,
  BAJAS_POR_FECHA: `${API_BASE_URL}/api/bajas/por-fecha`,
  
  // Proveedores
  PROVEEDORES: `${API_BASE_URL}/api/proveedores`,
  PROVEEDORES_DASHBOARD: `${API_BASE_URL}/api/proveedores/dashboard/stats`,
  
  // Rendimiento
  VENDEDORES: `${API_BASE_URL}/api/vendedores`,
  RENDIMIENTO: `${API_BASE_URL}/api/rendimiento`,
  
  // Stock (para compatibilidad)
  STOCK: `${API_BASE_URL}/api/productos/consultar-stock`,
};

// Para compatibilidad con archivos existentes
export const API_URL = `${API_BASE_URL}/api`;

// Exportar la instancia de axios configurada
export { api };

export default API_BASE_URL;