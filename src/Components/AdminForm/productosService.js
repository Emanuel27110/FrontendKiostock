// src/components/Productos/productosService.js
import { api } from '../../config/api.js'; // Usar la instancia configurada

export const fetchProductos = async () => {
  try {
    const response = await api.get("/productos");
    return response.data;
  } catch (error) {
    console.error("Error al obtener productos:", error.response?.data || error.message);
    throw error;
  }
};

export const createProducto = async (productoData) => {
  try {
    const response = await api.post("/productos", productoData);
    return response.data;
  } catch (error) {
    console.error("Error en createProducto:", error.response?.data || error.message);
    throw error;
  }
};

export const updateProducto = async (id, productoData) => {
  try {
    const response = await api.put(`/productos/${id}`, productoData);
    return response.data;
  } catch (error) {
    console.error("Error en updateProducto:", error.response?.data || error.message);
    throw error;
  }
};

export const deleteProducto = async (id) => {
  try {
    await api.delete(`/productos/${id}`);
  } catch (error) {
    console.error("Error al eliminar producto:", error.response?.data || error.message);
    throw error;
  }
};

// Nueva función para obtener productos con stock bajo
export const fetchProductosBajoStock = async () => {
  try {
    const response = await api.get("/productos/bajo-stock");
    return response.data;
  } catch (error) {
    console.error("Error al obtener productos con bajo stock:", error.response?.data || error.message);
    throw error;
  }
};

// Función para consultar stock de un producto por descripción
export const consultarStock = async (descripcion) => {
  try {
    // Codificar la descripción para manejar caracteres especiales
    const descripcionCodificada = encodeURIComponent(descripcion);
    const response = await api.get(`/productos/consultar-stock/${descripcionCodificada}`);
    return response.data;
  } catch (error) {
    console.error("Error al consultar stock:", error.response?.data || error.message);
    throw error;
  }
};

// Función para actualizar el stock de un producto
export const actualizarStockProducto = async (id, stockData) => {
  try {
    const response = await api.put(`/productos/${id}/actualizar-stock`, stockData);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar stock:", error.response?.data || error.message);
    throw error;
  }
};