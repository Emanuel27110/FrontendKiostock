import axios from "axios";

const API_URL = "http://localhost:4000/api";

// Crear una instancia de axios con configuración base
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Esto permite enviar cookies en las solicitudes cross-origin
  headers: {
    'Content-Type': 'application/json'
  }
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

// Obtener todas las promociones
export const fetchPromociones = async () => {
  try {
    const response = await axiosInstance.get("/promociones");
    return response.data;
  } catch (error) {
    console.error("Error al obtener promociones:", error);
    throw error;
  }
};

// Obtener todos los productos (para seleccionar en las promociones)
export const fetchProductos = async () => {
  try {
    const response = await axiosInstance.get("/productos");
    return response.data;
  } catch (error) {
    console.error("Error al obtener productos:", error);
    throw error;
  }
};

// Crear una nueva promoción
export const createPromocion = async (promocionData) => {
  try {
    // Asegurarse de que las fechas se envíen en formato ISO
    const formattedData = {
      ...promocionData,
      fechaInicio: promocionData.fechaInicio.toISOString(),
      fechaFin: promocionData.fechaFin.toISOString()
    };
    
    const response = await axiosInstance.post("/promociones", formattedData);
    return response.data;
  } catch (error) {
    console.error("Error al crear promoción:", error);
    throw error;
  }
};

// Actualizar una promoción existente
export const updatePromocion = async (id, promocionData) => {
  try {
    // Asegurarse de que las fechas se envíen en formato ISO
    const formattedData = {
      ...promocionData,
      fechaInicio: promocionData.fechaInicio.toISOString(),
      fechaFin: promocionData.fechaFin.toISOString()
    };
    
    const response = await axiosInstance.put(`/promociones/${id}`, formattedData);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar promoción:", error);
    throw error;
  }
};

// Eliminar una promoción
export const deletePromocion = async (id) => {
  try {
    const response = await axiosInstance.delete(`/promociones/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar promoción:", error);
    throw error;
  }
};

// Finalizar una promoción
export const finalizarPromocion = async (id) => {
  try {
    const response = await axiosInstance.post(`/promociones/${id}/finalizar`);
    return response.data;
  } catch (error) {
    console.error("Error al finalizar promoción:", error);
    throw error;
  }
};

// Obtener estadísticas de promociones
export const getEstadisticasPromociones = async () => {
  try {
    const response = await axiosInstance.get("/promociones/estadisticas");
    return response.data;
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    throw error;
  }
};

// Incrementar ventas de una promoción
export const incrementarVentasPromocion = async (id) => {
  try {
    const response = await axiosInstance.post(`/promociones/${id}/incrementar-ventas`);
    return response.data;
  } catch (error) {
    console.error("Error al incrementar ventas:", error);
    throw error;
  }
};
// Obtener estadísticas detalladas desde las ventas reales
export const getEstadisticasPromocionesCompletas = async () => {
  try {
    const response = await axiosInstance.get("/promociones/estadisticas-completas");
    return response.data;
  } catch (error) {
    console.error("Error al obtener estadísticas completas:", error);
    throw error;
  }
};