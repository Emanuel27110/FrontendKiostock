import React, { useState, useEffect } from "react";
import {
  obtenerEmbutidos,
  agregarEmbutido,
  actualizarStock,
  venderPorGramos,
  eliminarEmbutido,
  obtenerVentas,
  eliminarVenta,
  actualizarEmbutido,
} from "../AdminForm/embutidosService.js";
import NavBarForm from "../NavBarForm/NavBarForm";
import Swal from "sweetalert2";
import { api } from '../../config/api.js';
import "./EmbutidosAdmin.css";
import { imprimirTicketEmbutidos } from "./ticketEmbutidosService.js";
import { API_ENDPOINTS } from '../../config/api.js';

const EmbutidosAdmin = () => {
  const [embutidos, setEmbutidos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoEmbutido, setNuevoEmbutido] = useState({
    nombre: "",
    precioPorCienGramos: 0,
    stockGramos: 0,
  });
  const [embutidoEditando, setEmbutidoEditando] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  
  // Estados para la paginación de ventas
  const [currentPageVentas, setCurrentPageVentas] = useState(1);
  const [ventasPorPagina] = useState(5);
  const [paginasVisiblesVentas, setPaginasVisiblesVentas] = useState([]);
  
  // Estados para la paginación de embutidos
  const [currentPageEmbutidos, setCurrentPageEmbutidos] = useState(1);
  const [embutidosPorPagina] = useState(7); // Paginación de 7 productos
  const [paginasVisiblesEmbutidos, setPaginasVisiblesEmbutidos] = useState([]);
  
  // Estado para búsqueda
  const [busqueda, setBusqueda] = useState("");
  
  // Estado para filtros
  const [filtroStock, setFiltroStock] = useState("todos"); // "todos", "bajo", "medio", "alto"

  useEffect(() => {
    cargarDatos();
    obtenerPerfilUsuario();
  }, []);

  useEffect(() => {
    actualizarPaginasVisiblesVentas();
  }, [currentPageVentas, ventas]);
  
  useEffect(() => {
    actualizarPaginasVisiblesEmbutidos();
  }, [currentPageEmbutidos, embutidos]);

  // Nuevo useEffect para verificar stock bajo cuando se cargan los embutidos
  useEffect(() => {
    if (embutidos.length > 0 && !loading) {
      verificarStockBajo();
    }
  }, [embutidos, loading]);

  // Nueva función para verificar stock bajo
  const verificarStockBajo = () => {
    const productosStockBajo = embutidos.filter(e => e.stockGramos <= 300);
    
    if (productosStockBajo.length > 0) {
      // Crear lista de productos con stock bajo para mostrar en la alerta
      const listaProductos = productosStockBajo.map(
        producto => `<li>${producto.nombre}: <strong>${producto.stockGramos}g</strong> restantes</li>`
      ).join('');
      
      Swal.fire({
        title: '¡Atención! Stock Bajo',
        icon: 'warning',
        html: `
          <p>Los siguientes productos tienen stock bajo:</p>
          <ul style="text-align: left; margin-top: 10px;">${listaProductos}</ul>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6',
        width: '600px',
      });
    }
  };

  // Función para actualizar las páginas visibles en la paginación de ventas
  const actualizarPaginasVisiblesVentas = () => {
    const totalPaginas = Math.ceil(ventas.length / ventasPorPagina);
    let paginas = [];
    
    if (totalPaginas <= 5) {
      // Si hay 5 o menos páginas, mostrar todas
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      // Si hay más de 5 páginas, crear una navegación más compleja
      if (currentPageVentas <= 3) {
        // Si estamos en las primeras páginas
        paginas = [1, 2, 3, 4, 5];
      } else if (currentPageVentas >= totalPaginas - 2) {
        // Si estamos en las últimas páginas
        paginas = [
          totalPaginas - 4,
          totalPaginas - 3, 
          totalPaginas - 2,
          totalPaginas - 1,
          totalPaginas
        ];
      } else {
        // Si estamos en páginas intermedias
        paginas = [
          currentPageVentas - 2,
          currentPageVentas - 1,
          currentPageVentas,
          currentPageVentas + 1,
          currentPageVentas + 2
        ];
      }
    }
    
    setPaginasVisiblesVentas(paginas);
  };
  
  // Función para actualizar las páginas visibles en la paginación de embutidos
  const actualizarPaginasVisiblesEmbutidos = () => {
    const totalPaginas = Math.ceil(embutidosFiltrados.length / embutidosPorPagina);
    let paginas = [];
    
    if (totalPaginas <= 5) {
      // Si hay 5 o menos páginas, mostrar todas
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      // Si hay más de 5 páginas, crear una navegación más compleja
      if (currentPageEmbutidos <= 3) {
        // Si estamos en las primeras páginas
        paginas = [1, 2, 3, 4, 5];
      } else if (currentPageEmbutidos >= totalPaginas - 2) {
        // Si estamos en las últimas páginas
        paginas = [
          totalPaginas - 4,
          totalPaginas - 3, 
          totalPaginas - 2,
          totalPaginas - 1,
          totalPaginas
        ];
      } else {
        // Si estamos en páginas intermedias
        paginas = [
          currentPageEmbutidos - 2,
          currentPageEmbutidos - 1,
          currentPageEmbutidos,
          currentPageEmbutidos + 1,
          currentPageEmbutidos + 2
        ];
      }
    }
    
    setPaginasVisiblesEmbutidos(paginas);
  };

  // Función para obtener el perfil del usuario actual
  // POR ESTO:
const obtenerPerfilUsuario = async () => {
  try {
    const response = await api.get('/api/profile');
    setUsuarioActual(response.data);
    
    // Inicializar el campo vendedor con el nombre del usuario actual
    setVenta(prevVenta => ({
      ...prevVenta,
      vendedor: response.data.nombre
    }));
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
  }
};

  const cargarDatos = async () => {
    setLoading(true);
    try {
      await Promise.all([cargarEmbutidos(), cargarVentas()]);
      // La verificación de stock bajo se realizará en el useEffect
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEmbutidos = async () => {
    try {
      const data = await obtenerEmbutidos();
      setEmbutidos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar embutidos:", error);
      Swal.fire("Error", "No se pudieron cargar los embutidos", "error");
      setEmbutidos([]);
    }
  };

  const cargarVentas = async () => {
    try {
      const data = await obtenerVentas();
      setVentas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar ventas:", error);
      Swal.fire("Error", "No se pudieron cargar las ventas", "error");
      setVentas([]);
    }
  };

  const handleAgregar = async () => {
    try {
      if (!nuevoEmbutido.nombre) {
        Swal.fire("Error", "El nombre es requerido", "error");
        return;
      }
      
      if (nuevoEmbutido.precioPorCienGramos <= 0) {
        Swal.fire("Error", "El precio debe ser mayor a 0", "error");
        return;
      }
      
      // Verificar si ya existe un embutido con el mismo nombre (ignorando mayúsculas/minúsculas)
      const nombreExiste = embutidos.some(
        e => e.nombre.toLowerCase() === nuevoEmbutido.nombre.toLowerCase()
      );
      
      if (nombreExiste) {
        Swal.fire("Error", "Ya existe un embutido con este nombre", "error");
        return;
      }
      
      await agregarEmbutido(nuevoEmbutido);
      Swal.fire("¡Éxito!", "Embutido agregado correctamente", "success");
      await cargarEmbutidos();
      setNuevoEmbutido({ nombre: "", precioPorCienGramos: 0, stockGramos: 0 });
    } catch (error) {
      console.error("Error al agregar embutido:", error);
      Swal.fire("Error", "No se pudo agregar el embutido", "error");
    }
  };

  const handleActualizarStock = async (id, cantidad) => {
    try {
      await actualizarStock(id, cantidad);
      Swal.fire("¡Éxito!", "Stock actualizado correctamente", "success");
      await cargarEmbutidos();
      
      // Verificar si el producto tiene stock bajo después de la actualización
      const productoActualizado = embutidos.find(e => e._id === id);
      if (productoActualizado && productoActualizado.stockGramos <= 300) {
        Swal.fire({
          title: '¡Atención! Stock Bajo',
          icon: 'warning',
          html: `
            <p>El producto <strong>${productoActualizado.nombre}</strong> tiene un stock bajo:</p>
            <p style="margin-top: 10px;"><strong>${productoActualizado.stockGramos}g</strong> restantes</p>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3085d6',
        });
      }
    } catch (error) {
      console.error("Error al actualizar stock:", error);
      Swal.fire("Error", "No se pudo actualizar el stock", "error");
    }
  };

  const handleEliminarEmbutido = async (id) => {
    try {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción no se puede revertir",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });
      
      if (result.isConfirmed) {
        await eliminarEmbutido(id);
        Swal.fire("¡Éxito!", "Embutido eliminado correctamente", "success");
        cargarEmbutidos();
      }
    } catch (error) {
      console.error("Error al eliminar embutido:", error);
      Swal.fire("Error", "No se pudo eliminar el embutido", "error");
    }
  };

  const [venta, setVenta] = useState({ 
    vendedor: "", 
    embutidoId: "", 
    cantidadGramos: 0 
  });
  
  const handleVender = async () => {
    try {
      const { vendedor, embutidoId, cantidadGramos } = venta;
      if (!embutidoId || !cantidadGramos) {
        Swal.fire("Error", "Debe seleccionar un embutido y la cantidad", "error");
        return;
      }
      
      // Verificar si hay stock suficiente
      const embutidoSeleccionado = embutidos.find(e => e._id === embutidoId);
      if (!embutidoSeleccionado) return;
      
      if (embutidoSeleccionado.stockGramos < cantidadGramos) {
        Swal.fire("Error", `Stock insuficiente. Solo hay ${embutidoSeleccionado.stockGramos}g disponibles.`, "error");
        return;
      }
      
      // Calcular el stock que quedará después de la venta
      const stockRestante = embutidoSeleccionado.stockGramos - cantidadGramos;
      
      // Calcular precio total
      const precioTotal = (embutidoSeleccionado.precioPorCienGramos * cantidadGramos) / 100;
      
      // Usamos el nombre del usuario actual como vendedor
      const ventaResponse = await venderPorGramos(embutidoId, cantidadGramos, usuarioActual.nombre);

      // Crear objeto de venta completo para ticket
      const ventaParaTicket = {
        ...ventaResponse,
        embutido: embutidoSeleccionado,
        cantidadGramos: cantidadGramos,
        precioTotal: precioTotal,
        precioUnitario: embutidoSeleccionado.precioPorCienGramos,
        vendedor: usuarioActual.nombre,
        fecha: new Date().toISOString()
      };

      Swal.fire({
        title: "¡Éxito!",
        text: "Venta realizada correctamente",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "OK",
        cancelButtonText: "Imprimir Ticket",
        cancelButtonColor: "#3085d6"
      }).then((result) => {
        if (result.dismiss === Swal.DismissReason.cancel) {
          // User clicked "Imprimir Ticket"
          imprimirTicketEmbutidos(ventaParaTicket);
        }
      });
      
      await cargarDatos();
      
      // Verificar si después de la venta el stock quedó bajo
      if (stockRestante <= 300) {
        Swal.fire({
          title: '¡Atención! Stock Bajo',
          icon: 'warning',
          html: `
            <p>Después de esta venta, el producto <strong>${embutidoSeleccionado.nombre}</strong> tiene un stock bajo:</p>
            <p style="margin-top: 10px;"><strong>${stockRestante}g</strong> restantes</p>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3085d6',
        });
      }
      
      // Reiniciamos solo los campos que deben limpiarse
      setVenta(prevVenta => ({ 
        ...prevVenta, 
        embutidoId: "", 
        cantidadGramos: 0 
      }));
    } catch (error) {
      console.error("Error al realizar venta:", error);
      Swal.fire("Error", error.response?.data?.message || "No se pudo realizar la venta", "error");
    }
  }; 
  const handleEliminarVenta = async (id) => {
    try {
      const result = await Swal.fire({
        title: "¿Estás seguro?",
        text: "Esta acción no se puede revertir",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
      });
      
      if (result.isConfirmed) {
        await eliminarVenta(id);
        Swal.fire("¡Éxito!", "Venta eliminada correctamente", "success");
        cargarVentas();
      }
    } catch (error) {
      console.error("Error al eliminar venta:", error);
      Swal.fire("Error", "No se pudo eliminar la venta", "error");
    }
  };

  const handleEditarEmbutido = async () => {
    try {
      if (!embutidoEditando) return;

      await actualizarEmbutido(embutidoEditando._id, {
        nombre: embutidoEditando.nombre,
        precioPorCienGramos: embutidoEditando.precioPorCienGramos,
        stockGramos: embutidoEditando.stockGramos
      });

      Swal.fire("¡Éxito!", "Embutido actualizado correctamente", "success");
      await cargarEmbutidos();
      
      // Verificar si después de la edición el stock quedó bajo
      if (embutidoEditando.stockGramos <= 300) {
        Swal.fire({
          title: '¡Atención! Stock Bajo',
          icon: 'warning',
          html: `
            <p>El producto <strong>${embutidoEditando.nombre}</strong> tiene un stock bajo:</p>
            <p style="margin-top: 10px;"><strong>${embutidoEditando.stockGramos}g</strong> restantes</p>
          `,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#3085d6',
        });
      }
      
      setEmbutidoEditando(null);
    } catch (error) {
      console.error("Error al editar embutido:", error);
      Swal.fire("Error", "No se pudo actualizar el embutido", "error");
    }
  };

  const iniciarEdicion = (embutido) => {
    setEmbutidoEditando({...embutido});
  };

  const cancelarEdicion = () => {
    setEmbutidoEditando(null);
  };

  // Filtrar embutidos según criterios de búsqueda y filtros
  const embutidosFiltrados = embutidos.filter(embutido => {
    // Filtro por nombre
    const coincideNombre = embutido.nombre.toLowerCase().includes(busqueda.toLowerCase());
    
    // Filtro por nivel de stock
    let pasaFiltroStock = true;
    if (filtroStock === "bajo") {
      pasaFiltroStock = embutido.stockGramos < 500;
    } else if (filtroStock === "medio") {
      pasaFiltroStock = embutido.stockGramos >= 500 && embutido.stockGramos < 2000;
    } else if (filtroStock === "alto") {
      pasaFiltroStock = embutido.stockGramos >= 2000;
    }
    
    return coincideNombre && pasaFiltroStock;
  });

  // Paginación para embutidos
  const indexUltimoEmbutido = currentPageEmbutidos * embutidosPorPagina;
  const indexPrimerEmbutido = indexUltimoEmbutido - embutidosPorPagina;
  const embutidosActuales = embutidosFiltrados.slice(indexPrimerEmbutido, indexUltimoEmbutido);
  const totalPaginasEmbutidos = Math.ceil(embutidosFiltrados.length / embutidosPorPagina);

  // Lógica para la paginación de ventas
  const indexUltimaVenta = currentPageVentas * ventasPorPagina;
  const indexPrimeraVenta = indexUltimaVenta - ventasPorPagina;
  const ventasActuales = ventas.slice(indexPrimeraVenta, indexUltimaVenta);
  const totalPaginasVentas = Math.ceil(ventas.length / ventasPorPagina);

  const cambiarPaginaVentas = (numeroPagina) => {
    if (numeroPagina < 1 || numeroPagina > totalPaginasVentas) {
      return;
    }
    setCurrentPageVentas(numeroPagina);
  };
  
  const cambiarPaginaEmbutidos = (numeroPagina) => {
    if (numeroPagina < 1 || numeroPagina > totalPaginasEmbutidos) {
      return;
    }
    setCurrentPageEmbutidos(numeroPagina);
  };


  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="embutidos-admin-container">
      <NavBarForm />
      <h1 className="titulo">Gestión de Embutidos/Cereales</h1>
        
      {/* Sección de Dashboard/Resumen */}
      <div className="section">
        <h2 className="section-titulo">Resumen de Inventario y Ventas</h2>
        
        <div className="dashboard-grid">
          {/* Tarjetas de Resumen */}
          <div className="dashboard-card">
            <div className="card-icon stock-icon"></div>
            <div className="card-content">
              <div className="card-title">Total Productos</div>
              <div className="card-value">{embutidos.length}</div>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-icon ventas-icon"></div>
            <div className="card-content">
              <div className="card-title">Total Ventas</div>
              <div className="card-value">{ventas.length}</div>
            </div>
          </div>
          
          
          <div className="dashboard-card">
            <div className="card-icon alerta-icon"></div>
            <div className="card-content">
              <div className="card-title">Productos Escasos</div>
              <div className="card-value">{embutidos.filter(e => e.stockGramos <= 300).length}</div>
            </div>
          </div>
        </div>
        
        {/* Listado de productos con stock bajo */}
        {embutidos.filter(e => e.stockGramos <= 300).length > 0 && (
          <div className="stock-bajo-alerta">
            <h3>¡Atención! Productos con stock bajo</h3>
            <ul>
              {embutidos
                .filter(e => e.stockGramos <= 300)
                .map(e => (
                  <li key={e._id}>
                    {e.nombre}: <strong>{e.stockGramos}g</strong> restantes
                  </li>
                ))
              }
            </ul>
          </div>
        )}
      </div>
      <div className="section">
        <h2 className="section-titulo">Listado de Embutidos/Cereales</h2>
        
        {/* Búsqueda y filtros */}
        <div className="filtros-container">
          <div className="busqueda-container">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setCurrentPageEmbutidos(1); // Resetear a primera página al buscar
              }}
              className="busqueda-input"
            />
          </div>
          <div className="filtro-stock">
            <label htmlFor="filtroStock">Filtrar por stock:</label>
            <select 
              id="filtroStock" 
              value={filtroStock}
              onChange={(e) => {
                setFiltroStock(e.target.value);
                setCurrentPageEmbutidos(1); // Resetear a primera página al filtrar
              }}
            >
              <option value="todos">Todos</option>
              <option value="bajo">Bajo (&lt;500g)</option>
              <option value="medio">Medio (500g-2000g)</option>
              <option value="alto">Alto (&gt;2000g)</option>
            </select>
          </div>
        </div>
        
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Precio por 100g</th>
                <th>Stock (g)</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {embutidosActuales && embutidosActuales.map((embutido) => (
                <tr key={embutido._id} className={embutido.stockGramos <= 300 ? "stock-bajo" : ""}>
                  {embutidoEditando && embutidoEditando._id === embutido._id ? (
                    <>
                      <td>
                        <input 
                          type="text" 
                          value={embutidoEditando.nombre} 
                          onChange={(e) => setEmbutidoEditando({
                            ...embutidoEditando, 
                            nombre: e.target.value
                          })}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={embutidoEditando.precioPorCienGramos} 
                          onChange={(e) => setEmbutidoEditando({
                            ...embutidoEditando, 
                            precioPorCienGramos: parseFloat(e.target.value) || 0
                          })}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={embutidoEditando.stockGramos} 
                          onChange={(e) => setEmbutidoEditando({
                            ...embutidoEditando, 
                            stockGramos: parseInt(e.target.value, 10) || 0
                          })}
                        />
                      </td>
                      <td className="acciones-columna">
                        <button 
                          className="boton-guardar" 
                          onClick={handleEditarEmbutido}
                        >
                          Guardar
                        </button>
                        <button 
                          className="boton-cancelar" 
                          onClick={cancelarEdicion}
                        >
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{embutido.nombre}</td>
                      <td>${embutido.precioPorCienGramos}</td>
                      <td>{embutido.stockGramos}g</td>
                      <td className="acciones-columna">
                        <button
                          className="boton-editar"
                          onClick={() => iniciarEdicion(embutido)}
                        >
                          Editar
                        </button>
                        <button
                          className="boton-eliminar"
                          onClick={() => handleEliminarEmbutido(embutido._id)}
                        >
                          Eliminar
                        </button>
                        <button
                          className="boton-añadir-stock"
                          onClick={() => {
                            Swal.fire({
                              title: 'Agregar stock',
                              input: 'number',
                              inputLabel: 'Cantidad a agregar (gramos)',
                              showCancelButton: true,
                              confirmButtonText: 'Agregar',
                              cancelButtonText: 'Cancelar',
                              inputValidator: (value) => {
                                if (!value) {
                                  return 'Debe ingresar una cantidad';
                                }
                                if (value <= 0) {
                                  return 'La cantidad debe ser mayor a 0';
                                }
                              }
                            }).then((result) => {
                              if (result.isConfirmed) {
                                handleActualizarStock(embutido._id, parseInt(result.value, 10));
                              }
                            });
                          }}
                        >
                          + Stock
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Paginación para embutidos */}
        {embutidosFiltrados.length > 0 && (
          <div className="paginacion">
            <button 
              className={`paginacion-boton ${currentPageEmbutidos === 1 ? 'disabled' : ''}`}
              onClick={() => cambiarPaginaEmbutidos(1)}
              disabled={currentPageEmbutidos === 1}
            >
              &laquo;
            </button>
            <button 
              className={`paginacion-boton ${currentPageEmbutidos === 1 ? 'disabled' : ''}`}
              onClick={() => cambiarPaginaEmbutidos(currentPageEmbutidos - 1)}
              disabled={currentPageEmbutidos === 1}
            >
              &lt;
            </button>
            
            {paginasVisiblesEmbutidos.map(numero => (
              <button
                key={numero}
                className={`paginacion-boton ${currentPageEmbutidos === numero ? 'activo' : ''}`}
                onClick={() => cambiarPaginaEmbutidos(numero)}
              >
                {numero}
              </button>
            ))}
            
            <button 
              className={`paginacion-boton ${currentPageEmbutidos === totalPaginasEmbutidos ? 'disabled' : ''}`}
              onClick={() => cambiarPaginaEmbutidos(currentPageEmbutidos + 1)}
              disabled={currentPageEmbutidos === totalPaginasEmbutidos}
            >
              &gt;
            </button>
            <button 
              className={`paginacion-boton ${currentPageEmbutidos === totalPaginasEmbutidos ? 'disabled' : ''}`}
              onClick={() => cambiarPaginaEmbutidos(totalPaginasEmbutidos)}
              disabled={currentPageEmbutidos === totalPaginasEmbutidos}
            >
              &raquo;
            </button>
          </div>
        )}
        
        <div className="info-paginacion">
          Mostrando {embutidosFiltrados.length > 0 ? indexPrimerEmbutido + 1 : 0} a {Math.min(indexUltimoEmbutido, embutidosFiltrados.length)} de {embutidosFiltrados.length} productos
        </div>
      </div>

      {/* Agregar Embutido y Vender secciones */}
      <div className="grid-container">
        <div className="section">
          <h2 className="section-titulo">Agregar Nuevo Embutido/Cereal</h2>
          <div className="formulario">
            <div className="campo-formulario">
              <label htmlFor="nombre">Nombre del embutido/Cereal:</label>
              <input
                id="nombre"
                type="text"
                placeholder="Nombre"
                value={nuevoEmbutido.nombre}
                onChange={(e) =>
                  setNuevoEmbutido({ ...nuevoEmbutido, nombre: e.target.value })
                }
              />
            </div>
            
            <div className="campo-formulario">
              <label htmlFor="precioPorCien">Precio por 100 gramos ($):</label>
              <input
                id="precioPorCien"
                type="number"
                placeholder="0"
                value={nuevoEmbutido.precioPorCienGramos === 0 ? '' : nuevoEmbutido.precioPorCienGramos}
                onChange={(e) =>
                  setNuevoEmbutido({
                    ...nuevoEmbutido,
                    precioPorCienGramos: e.target.value === '' ? 0 : parseFloat(e.target.value),
                  })
                }
              />
            </div>

            <div className="campo-formulario">
              <label htmlFor="stockInicial">Stock inicial (gramos):</label>
              <input
                id="stockInicial"
                type="number"
                placeholder="0"
                value={nuevoEmbutido.stockGramos === 0 ? '' : nuevoEmbutido.stockGramos}
                onChange={(e) =>
                  setNuevoEmbutido({
                    ...nuevoEmbutido,
                    stockGramos: e.target.value === '' ? 0 : parseInt(e.target.value, 10),
                  })
                }
              />
            </div>

            <button onClick={handleAgregar} className="boton-agregar">
              Agregar Producto
            </button>
          </div>
        </div>

        {/* Vender Embutido */}
        <div className="section">
          <h2 className="section-titulo">Registrar Venta</h2>
          <div className="formulario">
            <div className="campo-formulario">
              <label htmlFor="vendedor">Vendedor:</label>
              <input
                id="vendedor"
                type="text"
                value={usuarioActual?.nombre || ""}
                disabled
                className="input-readonly"
              />
            </div>
            <div className="campo-formulario">
              <label htmlFor="embutido">Seleccionar Embutido/Cereal:</label>
              <select
                id="embutido"
                value={venta.embutidoId}
                onChange={(e) => setVenta({ ...venta, embutidoId: e.target.value })}
              >
                <option value="">Seleccionar Embutido/Cereal</option>
                {embutidos && embutidos.map((embutido) => (
                  <option value={embutido._id} key={embutido._id} disabled={embutido.stockGramos <= 0}>
                    {embutido.nombre} - Disponible: {embutido.stockGramos}g
                  </option>
                ))}
              </select>
            </div>
            <div className="campo-formulario">
              <label htmlFor="gramos">Gramos a vender:</label>
              <input
                id="gramos"
                type="number"
                placeholder="Gramos a vender"
                value={venta.cantidadGramos || ""}
                onChange={(e) =>
                  setVenta({ ...venta, cantidadGramos: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>
            
            {/* Mostrar precio estimado si se ha seleccionado un producto y cantidad */}
            {venta.embutidoId && venta.cantidadGramos > 0 && (
              <div className="precio-estimado">
                <p>
                  <strong>Precio estimado: </strong>
                  ${(() => {
                    const embutido = embutidos.find(e => e._id === venta.embutidoId);
                    if (embutido) {
                      return ((embutido.precioPorCienGramos * venta.cantidadGramos) / 100).toFixed(2);
                    }
                    return "0.00";
                  })()}
                </p>
              </div>
            )}
            
            <button onClick={handleVender} className="boton-vender">
              Registrar Venta
            </button>
          </div>
        </div>
      </div>

      {/* Listar Ventas con Paginación */}
      <div className="section">
        <h2 className="section-titulo">
          Historial de Ventas
 
        </h2>
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Embutido/Cereal</th>
                <th>Gramos</th>
                <th>Precio/100g</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventasActuales && ventasActuales.map((venta) => {
                if (!venta.embutido) return null;
                
                return (
                  <tr key={venta._id}>
                    <td>{venta.vendedor}</td>
                    <td>{venta.embutido.nombre}</td>
                    <td>{venta.cantidadGramos}g</td>
                    <td>${venta.precioUnitario}</td>
                    <td>${venta.precioTotal.toFixed(2)}</td>
                    <td>{new Date(venta.fecha).toLocaleString("es-AR")}</td>

                    <td className="acciones-ventas">
                      <button
                        className="boton-eliminar"
                        onClick={() => handleEliminarVenta(venta._id)}
                      >
                        Eliminar
                      </button>
                      <button
                        className="boton-imprimir"
                        onClick={() => imprimirTicketEmbutidos(venta)}
                       >
                        Ticket
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Componente de Paginación para ventas */}
        {ventas.length > 0 && (
          <div className="paginacion">
            <button 
              className={`paginacion-boton ${currentPageVentas === 1 ? 'disabled' : ''}`}
              onClick={() => cambiarPaginaVentas(1)}
              disabled={currentPageVentas === 1}
            >
              &laquo;
            </button>
            <button 
              className={`paginacion-boton ${currentPageVentas === 1 ? 'disabled' : ''}`}
              onClick={() => cambiarPaginaVentas(currentPageVentas - 1)}
              disabled={currentPageVentas === 1}
            >
              &lt;
            </button>
            
            {paginasVisiblesVentas.map(numero => (
              <button
                key={numero}
                className={`paginacion-boton ${currentPageVentas === numero ? 'activo' : ''}`}
                onClick={() => cambiarPaginaVentas(numero)}
              >
                {numero}
              </button>
            ))}
            
            <button 
              className={`paginacion-boton ${currentPageVentas === totalPaginasVentas ? 'disabled' : ''}`}
              onClick={() => cambiarPaginaVentas(currentPageVentas + 1)}
              disabled={currentPageVentas === totalPaginasVentas}
            >
              &gt;
            </button>
            <button 
              className={`paginacion-boton ${currentPageVentas === totalPaginasVentas ? 'disabled' : ''}`}
              onClick={() => cambiarPaginaVentas(totalPaginasVentas)}
              disabled={currentPageVentas === totalPaginasVentas}
            >
              &raquo;
            </button>
          </div>
        )}
        
        <div className="info-paginacion">
          Mostrando {ventas.length > 0 ? indexPrimeraVenta + 1 : 0} a {Math.min(indexUltimaVenta, ventas.length)} de {ventas.length} ventas
        </div>
      </div>
    
    </div>
  );
};

export default EmbutidosAdmin;