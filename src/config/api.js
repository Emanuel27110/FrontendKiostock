// src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  // Usuarios
  USERS: `${API_BASE_URL}/api/users`,
  REGISTER: `${API_BASE_URL}/api/register`,
  LOGIN: `${API_BASE_URL}/api/login`,
  LOGOUT: `${API_BASE_URL}/api/logout`,
  PROFILE: `${API_BASE_URL}/api/profile`,
  
  // Productos
  PRODUCTOS: `${API_BASE_URL}/api/productos`,
  
  // Ventas
  VENTAS: `${API_BASE_URL}/api/ventas`,
  VENTAS_EMBUTIDOS: `${API_BASE_URL}/api/ventas-embutidos`,
  
  // Promociones
  PROMOCIONES: `${API_BASE_URL}/api/promociones`,
  
  // Notas
  NOTAS: `${API_BASE_URL}/api/notas`,
  
  // Caja
  CAJA: `${API_BASE_URL}/api/caja`,
  
  // Stock
  STOCK: `${API_BASE_URL}/api/productos/consultar-stock`,
};

// Para compatibilidad con archivos existentes
export const API_URL = `${API_BASE_URL}/api`;

export default API_BASE_URL;