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