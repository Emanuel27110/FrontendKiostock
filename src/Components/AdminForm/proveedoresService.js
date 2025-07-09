import { api, API_ENDPOINTS } from '../../config/api';

// Servicio para proveedores
export const getProveedores = async () => {
  try {
    const response = await api.get('/api/proveedores');
    return response.data;
  } catch (error) {
    console.error('Error al obtener proveedores:', error.response?.data || error.message);
    throw error;
  }
};

export const getProveedorById = async (id) => {
  try {
    const response = await api.get(`/api/proveedores/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener proveedor con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const createProveedor = async (proveedor) => {
  try {
    const response = await api.post('/api/proveedores', proveedor);
    return response.data;
  } catch (error) {
    console.error('Error al crear proveedor:', error.response?.data || error.message);
    throw error;
  }
};

export const updateProveedor = async (id, proveedor) => {
  try {
    const response = await api.put(`/api/proveedores/${id}`, proveedor);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar proveedor con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const deleteProveedor = async (id) => {
  try {
    const response = await api.delete(`/api/proveedores/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar proveedor con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const getComprasPorProveedor = async (id) => {
  try {
    const response = await api.get(`/api/proveedores/${id}/compras`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener compras del proveedor con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/api/proveedores/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error.response?.data || error.message);
    throw error;
  }
};

// Servicio para compras
export const createCompra = async (compra) => {
  try {
    const response = await api.post('/api/compras', compra);
    return response.data;
  } catch (error) {
    console.error('Error al crear compra:', error.response?.data || error.message);
    throw error;
  }
};

export const getCompras = async (filtros = {}) => {
  try {
    const response = await api.get('/api/compras', { params: filtros });
    return response.data;
  } catch (error) {
    console.error('Error al obtener compras:', error.response?.data || error.message);
    throw error;
  }
};

export const getCompraById = async (id) => {
  try {
    const response = await api.get(`/api/compras/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener compra con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const updateCompra = async (id, compra) => {
  try {
    const response = await api.put(`/api/compras/${id}`, compra);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar compra con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const deleteCompra = async (id) => {
  try {
    const response = await api.delete(`/api/compras/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar compra con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const getEstadisticasCompras = async (filtros = {}) => {
  try {
    const response = await api.get('/api/compras/estadisticas', { params: filtros });
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de compras:', error.response?.data || error.message);
    throw error;
  }
};