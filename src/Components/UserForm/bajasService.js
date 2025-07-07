// bajasService.js
import axios from 'axios';

import { API_URL } from '../../config/api.js';

// Configuración para usar cookies en lugar de tokens
const getConfig = () => {
  return {
    headers: {
      'Content-Type': 'application/json'
    },
    withCredentials: true  // Importante: esto hace que se envíen cookies con la solicitud
  };
};

// Manejar errores de autenticación
const handleAuthError = (error) => {
  if (error.response && error.response.status === 401) {
    console.error('Error de autenticación. Redirigiendo al login...');
    window.location.href = '/login';
  }
  throw error;
};

// Obtener todas las bajas
export const fetchBajas = async () => {
  try {
    const response = await axios.get(`${API_URL}/bajas`, getConfig());
    return response.data;
  } catch (error) {
    console.error('Error al obtener bajas:', error);
    return handleAuthError(error);
  }
};

// Obtener una baja por ID
export const fetchBaja = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/bajas/${id}`, getConfig());
    return response.data;
  } catch (error) {
    console.error(`Error al obtener baja con ID ${id}:`, error);
    return handleAuthError(error);
  }
};

// Crear una nueva baja
export const createBaja = async (bajaData) => {
  try {
    const response = await axios.post(`${API_URL}/bajas`, bajaData, getConfig());
    return response.data;
  } catch (error) {
    console.error('Error al crear baja:', error);
    return handleAuthError(error);
  }
};

// Eliminar una baja
export const deleteBaja = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/bajas/${id}`, getConfig());
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar baja con ID ${id}:`, error);
    return handleAuthError(error);
  }
};

// Obtener estadísticas de bajas
export const fetchEstadisticasBajas = async () => {
  try {
    const response = await axios.get(`${API_URL}/bajas/estadisticas`, getConfig());
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de bajas:', error);
    return handleAuthError(error);
  }
};

// Obtener bajas por rango de fechas
export const fetchBajasPorFecha = async (fechaInicio, fechaFin) => {
  try {
    const response = await axios.get(
      `${API_URL}/bajas/por-fecha?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
      getConfig()
    );
    return response.data;
  } catch (error) {
    console.error('Error al obtener bajas por fecha:', error);
    return handleAuthError(error);
  }
};

// Actualizar una baja existente
export const updateBaja = async (id, bajaData) => {
  try {
    const response = await axios.put(`${API_URL}/bajas/${id}`, bajaData, getConfig());
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar baja con ID ${id}:`, error);
    return handleAuthError(error);
  }
};