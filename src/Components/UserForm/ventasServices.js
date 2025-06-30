import axios from "axios";

const API_URL = "http://localhost:4000/api";

// Obtener productos
export const getProductos = async () => {
  try {
    const response = await axios.get(`${API_URL}/productos`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw error;
  }
};

// Obtener ventas
export const getVentas = async () => {
  try {
    const response = await axios.get(`${API_URL}/ventas`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    throw error;
  }
};

// Crear una nueva venta
export const createVenta = async (ventaData) => {
  try {
    const response = await axios.post(`${API_URL}/ventas`, ventaData, { withCredentials: true });

    // Si se genera un QR de Mercado Pago, abrimos el enlace en una nueva pestaña
    if (response.data.qrPago) {
      window.open(response.data.qrPago, "_blank");
    }

    return response.data;
  } catch (error) {
    console.error("Error al crear la venta:", error);
    throw error;
  }
};

// Actualizar stock de un producto
export const actualizarStock = async (idProducto, cantidadVendida) => {
  try {
    const response = await axios.put(
      `${API_URL}/productos/${idProducto}/actualizar-stock`,
      { cantidadVendida },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error al actualizar stock:", error);
    throw error;
  }
};

// Eliminar una venta
export const eliminarVenta = async (ventaId) => {
  try {
    const response = await axios.delete(`${API_URL}/ventas/${ventaId}`, { withCredentials: true });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar la venta:", error);
    throw error;
  }
};
