import axios from "axios";

const API_URL = "http://localhost:4000/api"; // Base URL
const VENTAS_URL = `http://localhost:4000/api/ventas-embutidos`;

// Configuración con el token para autenticación
const config = {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
};

// Obtener todos los embutidos
export const obtenerEmbutidos = async () => {
  const response = await axios.get(`${API_URL}/embutidos`, config);
  return response.data;
};

// Agregar un nuevo embutido
export const agregarEmbutido = async (embutido) => {
  const response = await axios.post(`${API_URL}/embutidos`, embutido, config);
  return response.data;
};

// Actualizar el stock de un embutido
export const actualizarStock = async (id, cantidad) => {
  const response = await axios.put(
    `${API_URL}/embutidos/${id}/actualizar-stock`,
    { cantidad },
    config
  );
  return response.data;
};

// Vender por gramos - usando la ruta correcta del backend
export const venderPorGramos = async (embutidoId, cantidadGramos, vendedor) => {
  const response = await axios.post(
    VENTAS_URL,
    {
      embutidoId,
      vendedor,
      cantidadGramos
    },
    config
  );
  return response.data;
};

// Obtener todas las ventas realizadas
export const obtenerVentas = async () => {
  const response = await axios.get(VENTAS_URL, config);
  return response.data;
};

// Obtener ventas por fecha
export const obtenerVentasPorFecha = async (fecha) => {
  const response = await axios.get(`${VENTAS_URL}/fecha/${fecha}`, config);
  return response.data;
};

// Eliminar un embutido
export const eliminarEmbutido = async (id) => {
  const response = await axios.delete(`${API_URL}/embutidos/${id}`, config);
  return response.data;
};

// Eliminar una venta realizada
export const eliminarVenta = async (id) => {
  const response = await axios.delete(`${VENTAS_URL}/${id}`, config);
  return response.data;
};

// Actualizar embutido
export const actualizarEmbutido = async (id, datosActualizados) => {
  const response = await axios.put(`${API_URL}/embutidos/${id}`, datosActualizados, config);
  return response.data;
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