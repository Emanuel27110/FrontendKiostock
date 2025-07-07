import axios from "axios";

import { API_URL } from '../../config/api.js';

// Crear una instancia de axios con configuración base
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Esto permite enviar cookies en las solicitudes cross-origin
});

// Interceptor para agregar el token de autenticación a todas las solicitudes
axiosInstance.interceptors.request.use(
  (config) => {
    // Obtener el token del localStorage
    const token = localStorage.getItem("token");
    
    // Si hay un token, añadirlo a los headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const fetchProductos = async () => {
  try {
    const response = await axiosInstance.get("/productos");
    return response.data;
  } catch (error) {
    console.error("Error al obtener productos:", error.response?.data || error.message);
    throw error;
  }
};

export const createProducto = async (productoData) => {
  try {
    const response = await axiosInstance.post("/productos", productoData);
    return response.data;
  } catch (error) {
    console.error("Error en createProducto:", error.response?.data || error.message);
    throw error;
  }
};

export const updateProducto = async (id, productoData) => {
  try {
    const response = await axiosInstance.put(`/productos/${id}`, productoData);
    return response.data;
  } catch (error) {
    console.error("Error en updateProducto:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteProducto = async (id) => {
  try {
    await axiosInstance.delete(`/productos/${id}`);
  } catch (error) {
    console.error("Error al eliminar producto:", error.response?.data || error.message);
    throw error;
  }
};

// Nueva función para obtener productos con stock bajo
export const fetchProductosBajoStock = async () => {
  try {
    const response = await axiosInstance.get("/productos/bajo-stock");
    return response.data;
  } catch (error) {
    console.error("Error al obtener productos con bajo stock:", error.response?.data || error.message);
    throw error;
  }
};

// Función para consultar stock de un producto por descripción
export const consultarStock = async (descripcion) => {
  try {
    const response = await axiosInstance.get(`/productos/consultar-stock/${descripcion}`);
    return response.data;
  } catch (error) {
    console.error("Error al consultar stock:", error.response?.data || error.message);
    throw error;
  }
};

// Función para actualizar el stock de un producto
export const actualizarStockProducto = async (id, stockData) => {
  try {
    const response = await axiosInstance.put(`/productos/${id}/actualizar-stock`, stockData);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar stock:", error.response?.data || error.message);
    throw error;
  }
};