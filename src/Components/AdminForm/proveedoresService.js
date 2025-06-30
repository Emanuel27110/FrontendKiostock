import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Crear una instancia de axios con configuración consistente
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Servicio para proveedores
export const getProveedores = async () => {
  try {
    const response = await axiosInstance.get('/proveedores');
    return response.data;
  } catch (error) {
    console.error('Error al obtener proveedores:', error.response?.data || error.message);
    throw error;
  }
};

export const getProveedorById = async (id) => {
  try {
    const response = await axiosInstance.get(`/proveedores/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener proveedor con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const createProveedor = async (proveedor) => {
  try {
    const response = await axiosInstance.post('/proveedores', proveedor);
    return response.data;
  } catch (error) {
    console.error('Error al crear proveedor:', error.response?.data || error.message);
    throw error;
  }
};

export const updateProveedor = async (id, proveedor) => {
  try {
    const response = await axiosInstance.put(`/proveedores/${id}`, proveedor);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar proveedor con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const deleteProveedor = async (id) => {
  try {
    const response = await axiosInstance.delete(`/proveedores/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar proveedor con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};
export const getComprasPorProveedor = async (id) => {
  try {
    const response = await axiosInstance.get(`/proveedores/${id}/compras`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener compras del proveedor con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await axiosInstance.get('/proveedores/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error.response?.data || error.message);
    throw error;
  }
};

// Servicio para compras
export const createCompra = async (compra) => {
  try {
    const response = await axiosInstance.post('/compras', compra);
    return response.data;
  } catch (error) {
    console.error('Error al crear compra:', error.response?.data || error.message);
    throw error;
  }
};

export const getCompras = async (filtros = {}) => {
  try {
    const response = await axiosInstance.get('/compras', { params: filtros });
    return response.data;
  } catch (error) {
    console.error('Error al obtener compras:', error.response?.data || error.message);
    throw error;
  }
};

export const getCompraById = async (id) => {
  try {
    const response = await axiosInstance.get(`/compras/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener compra con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const updateCompra = async (id, compra) => {
  try {
    const response = await axiosInstance.put(`/compras/${id}`, compra);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar compra con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const deleteCompra = async (id) => {
  try {
    const response = await axiosInstance.delete(`/compras/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar compra con ID ${id}:`, error.response?.data || error.message);
    throw error;
  }
};

export const getEstadisticasCompras = async (filtros = {}) => {
  try {
    const response = await axiosInstance.get('/compras/estadisticas', { params: filtros });
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de compras:', error.response?.data || error.message);
    throw error;
  }
};