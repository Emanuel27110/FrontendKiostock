// embutidosService.js
import { api } from '../../config/api.js';
import { API_ENDPOINTS } from '../../config/api.js';

const VENTAS_URL = API_ENDPOINTS.VENTAS_EMBUTIDOS;

// Manejar errores de autenticación (igual que en bajasService)
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

// Obtener todos los embutidos
export const obtenerEmbutidos = async () => {
  try {
    const response = await api.get('/api/embutidos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener embutidos:', error);
    return handleAuthError(error);
  }
};

// Agregar un nuevo embutido
export const agregarEmbutido = async (embutido) => {
  try {
    const response = await api.post('/api/embutidos', embutido);
    return response.data;
  } catch (error) {
    console.error('Error al agregar embutido:', error);
    return handleAuthError(error);
  }
};

// Actualizar el stock de un embutido
export const actualizarStock = async (id, cantidad) => {
  try {
    const response = await api.put(
      `/api/embutidos/${id}/actualizar-stock`,
      { cantidad }
    );
    return response.data;
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    return handleAuthError(error);
  }
}; 

// Vender por gramos - usando la ruta correcta del backend
export const venderPorGramos = async (embutidoId, cantidadGramos, vendedor) => {
  try {
    const response = await api.post(
      '/api/ventas-embutidos',
      {
        embutidoId,
        vendedor,
        cantidadGramos
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error al vender por gramos:', error);
    return handleAuthError(error);
  }
};

// Obtener todas las ventas realizadas
export const obtenerVentas = async () => {
  try {
    const response = await api.get('/api/ventas-embutidos');
    return response.data;
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    return handleAuthError(error);
  }
};

// Obtener ventas por fecha
export const obtenerVentasPorFecha = async (fecha) => {
  try {
    const response = await api.get(`/api/ventas-embutidos/fecha/${fecha}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener ventas por fecha:', error);
    return handleAuthError(error);
  }
};

// Eliminar un embutido
export const eliminarEmbutido = async (id) => {
  try {
    const response = await api.delete(`/api/embutidos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar embutido:', error);
    return handleAuthError(error);
  }
};

// Eliminar una venta realizada
export const eliminarVenta = async (id) => {
  try {
    const response = await api.delete(`/api/ventas-embutidos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    return handleAuthError(error);
  }
};

// Actualizar embutido
export const actualizarEmbutido = async (id, datosActualizados) => {
  try {
    const response = await api.put(`/api/embutidos/${id}`, datosActualizados);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar embutido:', error);
    return handleAuthError(error);
  }
};

export default {
  obtenerEmbutidos,
  agregarEmbutido,
  actualizarStock,
  venderPorGramos,
  obtenerVentas,
  obtenerVentasPorFecha,
  eliminarEmbutido,
  eliminarVenta,
  actualizarEmbutido,
};