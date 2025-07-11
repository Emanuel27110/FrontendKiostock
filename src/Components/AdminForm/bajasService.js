// bajasService.js
import { api } from '../../config/api.js';

// Manejar errores de autenticación
const handleAuthError = (error) => {
  if (error.response && error.response.status === 401) {
    console.error('Error de autenticación. Sesión expirada.');
    // El interceptor de axios ya maneja la redirección, pero podemos agregar un backup
    if (!window.location.pathname.includes('/login')) {
      setTimeout(() => {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }, 1000);
    }
  }
  throw error;
};

// Obtener todas las bajas
export const fetchBajas = async () => {
  try {
    // Remover /api/ porque ya está en la baseURL de axios
    const response = await api.get('/bajas');
    return response.data;
  } catch (error) {
    console.error('Error al obtener bajas:', error);
    return handleAuthError(error);
  }
};

// Obtener una baja por ID
export const fetchBaja = async (id) => {
  try {
    const response = await api.get(`/bajas/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener baja con ID ${id}:`, error);
    return handleAuthError(error);
  }
};

// Crear una nueva baja
export const createBaja = async (bajaData) => {
  try {
    const response = await api.post('/bajas', bajaData);
    return response.data;
  } catch (error) {
    console.error('Error al crear baja:', error);
    return handleAuthError(error);
  }
};

// Eliminar una baja
export const deleteBaja = async (id) => {
  try {
    const response = await api.delete(`/bajas/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar baja con ID ${id}:`, error);
    return handleAuthError(error);
  }
};

// Obtener estadísticas de bajas
export const fetchEstadisticasBajas = async () => {
  try {
    const response = await api.get('/bajas/estadisticas');
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de bajas:', error);
    return handleAuthError(error);
  }
};

// Obtener bajas por rango de fechas
export const fetchBajasPorFecha = async (fechaInicio, fechaFin) => {
  try {
    const response = await api.get('/bajas/por-fecha', {
      params: {
        fechaInicio,
        fechaFin
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener bajas por fecha:', error);
    return handleAuthError(error);
  }
};

// Actualizar una baja existente
export const updateBaja = async (id, bajaData) => {
  try {
    const response = await api.put(`/bajas/${id}`, bajaData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar baja con ID ${id}:`, error);
    return handleAuthError(error);
  }
};

// Función para obtener productos (para usar en el componente Bajas)
export const fetchProductos = async () => {
  try {
    const response = await api.get('/productos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return handleAuthError(error);
  }
};

// Función para obtener perfil de usuario
export const fetchUserProfile = async () => {
  try {
    const response = await api.get('/profile');
    return response.data;
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return handleAuthError(error);
  }
};