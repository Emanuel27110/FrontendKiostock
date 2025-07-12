import { api } from '../../config/api.js';

// Manejar errores de autenticación
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

// Obtener productos
export const getProductos = async () => {
  try {
    // ✅ AGREGAR /api/ porque la baseURL es solo http://localhost:4000
    const response = await api.get('/api/productos');
    return response.data;
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return handleAuthError(error);
  }
};

// Obtener ventas
export const getVentas = async () => {
  try {
    // ✅ AGREGAR /api/
    const response = await api.get('/api/ventas');
    return response.data;
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return handleAuthError(error);
  }
};

// Crear una nueva venta con debugging mejorado
export const createVenta = async (ventaData) => {
  try {
    console.log('=== VENTASSERVICE DEBUG ===');
    console.log('URL:', '/api/ventas'); // ✅ ACTUALIZADO
    console.log('Método:', 'POST');
    console.log('Datos enviados:', JSON.stringify(ventaData, null, 2));
    console.log('============================');

    // ✅ AGREGAR /api/
    const response = await api.post('/api/ventas', ventaData, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('=== RESPUESTA EXITOSA ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.log('========================');

    // Si se genera un QR de Mercado Pago, abrimos el enlace en una nueva pestaña
    if (response.data.qrPago) {
      window.open(response.data.qrPago, "_blank");
    }

    return response.data;
  } catch (error) {
    console.error('=== ERROR DETALLADO EN VENTASSERVICE ===');
    console.error('Error completo:', error);
    
    if (error.response) {
      // El servidor respondió con un código de estado que cae fuera del rango de 2xx
      console.error('Status Code:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
      
      // Intentar extraer el mensaje de error específico
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          console.error('Mensaje de error:', error.response.data);
        } else if (error.response.data.message) {
          console.error('Mensaje de error:', error.response.data.message);
        } else if (error.response.data.error) {
          console.error('Mensaje de error:', error.response.data.error);
        } else if (error.response.data.errors) {
          console.error('Errores de validación:', error.response.data.errors);
        } else {
          console.error('Datos de error:', JSON.stringify(error.response.data, null, 2));
        }
      }
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('No response received:', error.request);
    } else {
      // Algo pasó al configurar la petición que desencadenó un error
      console.error('Error setting up request:', error.message);
    }
    
    console.error('Config:', error.config);
    console.error('=======================================');

    // Crear un error más descriptivo para mostrar al usuario
    let mensajeError = "Error desconocido al crear la venta";
    
    if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        mensajeError = error.response.data;
      } else if (error.response.data.message) {
        mensajeError = error.response.data.message;
      } else if (error.response.data.error) {
        mensajeError = error.response.data.error;
      } else if (error.response.data.errors) {
        // Para errores de validación
        if (Array.isArray(error.response.data.errors)) {
          mensajeError = error.response.data.errors.join(', ');
        } else {
          mensajeError = JSON.stringify(error.response.data.errors);
        }
      } else {
        mensajeError = `Error ${error.response.status}: ${JSON.stringify(error.response.data)}`;
      }
    } else if (error.message) {
      mensajeError = error.message;
    }

    // Crear un nuevo error con el mensaje específico
    const nuevoError = new Error(mensajeError);
    nuevoError.originalError = error;
    nuevoError.status = error.response?.status;
    nuevoError.data = error.response?.data;
    
    // Manejar errores de autenticación
    return handleAuthError(nuevoError);
  }
};

// Actualizar stock de un producto
export const actualizarStock = async (idProducto, cantidadVendida) => {
  try {
    // ✅ AGREGAR /api/
    const response = await api.put(
      `/api/productos/${idProducto}/actualizar-stock`,
      { cantidadVendida }
    );
    return response.data;
  } catch (error) {
    console.error("Error al actualizar stock:", error);
    return handleAuthError(error);
  }
};

// Eliminar una venta
export const eliminarVenta = async (ventaId) => {
  try {
    // ✅ AGREGAR /api/
    const response = await api.delete(`/api/ventas/${ventaId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar la venta:", error);
    return handleAuthError(error);
  }
};