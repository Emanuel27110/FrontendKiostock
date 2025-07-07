// src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

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

export default API_BASE_URL;