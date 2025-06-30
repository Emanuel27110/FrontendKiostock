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
import NavBarUser from "../NavBarForm/NavBarUser.jsx";
import Swal from "sweetalert2";
import axios from "axios";
import './embutidosUser.css'
import { imprimirTicketEmbutidos } from "./ticketEmbutidosService.js";

const EmbutidosUser = () => {
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
  
  // Estados para la búsqueda
  const [busquedaEmbutidos, setBusquedaEmbutidos] = useState("");
  const [embutidosFiltrados, setEmbutidosFiltrados] = useState([]);
  
  // Estados para la paginación de embutidos
  const [currentPageEmbutidos, setCurrentPageEmbutidos] = useState(1);
  const [embutidosPorPagina] = useState(5);
  const [paginasVisiblesEmbutidos, setPaginasVisiblesEmbutidos] = useState([]);
  
  // Estados para la paginación de ventas
  const [currentPage, setCurrentPage] = useState(1);
  const [ventasPorPagina] = useState(5);
  const [paginasVisibles, setPaginasVisibles] = useState([]);

  useEffect(() => {
    cargarDatos();
    obtenerPerfilUsuario();
  }, []);

  useEffect(() => {
    actualizarPaginasVisibles();
  }, [currentPage, ventas]);
  
  useEffect(() => {
    actualizarPaginasVisiblesEmbutidos();
  }, [currentPageEmbutidos, embutidosFiltrados]);

  useEffect(() => {
    filtrarEmbutidos();
  }, [embutidos, busquedaEmbutidos]);

  // Función para filtrar embutidos según la búsqueda
  const filtrarEmbutidos = () => {
    if (!busquedaEmbutidos.trim()) {
      setEmbutidosFiltrados(embutidos);
    } else {
      const filtrados = embutidos.filter(embutido => 
        embutido.nombre.toLowerCase().includes(busquedaEmbutidos.toLowerCase())
      );
      setEmbutidosFiltrados(filtrados);
    }
    setCurrentPageEmbutidos(1); // Reiniciar a la primera página cuando cambia el filtro
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

  // Función para actualizar las páginas visibles en la paginación de ventas
  const actualizarPaginasVisibles = () => {
    const totalPaginas = Math.ceil(ventas.length / ventasPorPagina);
    let paginas = [];
    
    if (totalPaginas <= 5) {
      // Si hay 5 o menos páginas, mostrar todas
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      // Si hay más de 5 páginas, crear una navegación más compleja
      if (currentPage <= 3) {
        // Si estamos en las primeras páginas
        paginas = [1, 2, 3, 4, 5];
      } else if (currentPage >= totalPaginas - 2) {
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
          currentPage - 2,
          currentPage - 1,
          currentPage,
          currentPage + 1,
          currentPage + 2
        ];
      }
    }
    
    setPaginasVisibles(paginas);
  };

  // Función para obtener el perfil del usuario actual
  const obtenerPerfilUsuario = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/profile", {
        withCredentials: true
      });
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
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarEmbutidos = async () => {
    try {
      const data = await obtenerEmbutidos();
      const embutidosArray = Array.isArray(data) ? data : [];
      setEmbutidos(embutidosArray);
      setEmbutidosFiltrados(embutidosArray);
      
      // Verificar si hay productos con stock bajo y mostrar alerta
      const productosEscasos = embutidosArray.filter(e => e.stockGramos <= 300);
      if (productosEscasos.length > 0) {
        Swal.fire({
          title: 'Stock Bajo',
          html: `<p>Los siguientes productos tienen menos de 300 gramos:</p>
                <ul style="text-align: left; margin-top: 10px;">
                  ${productosEscasos.map(e => `<li>${e.nombre}: <strong>${e.stockGramos}g</strong></li>`).join('')}
                </ul>`,
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
      }
    } catch (error) {
      console.error("Error al cargar embutidos:", error);
      Swal.fire("Error", "No se pudieron cargar los embutidos", "error");
      setEmbutidos([]);
      setEmbutidosFiltrados([]);
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
      await agregarEmbutido(nuevoEmbutido);
      Swal.fire("¡Éxito!", "Embutido agregado correctamente", "success");
      cargarEmbutidos();
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
      cargarEmbutidos();
    } catch (error) {
      console.error("Error al actualizar stock:", error);
      Swal.fire("Error", "No se pudo actualizar el stock", "error");
    }
  };

  const handleEliminarEmbutido = async (id) => {
    try {
      await eliminarEmbutido(id);
      Swal.fire("¡Éxito!", "Embutido eliminado correctamente", "success");
      cargarEmbutidos();
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
    const { embutidoId, cantidadGramos } = venta;
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
    
    cargarDatos();
    
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
      await eliminarVenta(id);
      Swal.fire("¡Éxito!", "Venta eliminada correctamente", "success");
      cargarVentas();
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
      cargarEmbutidos();
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

  // Función auxiliar para formatear la fecha
  const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Lógica para la paginación de ventas
  const indexUltimaVenta = currentPage * ventasPorPagina;
  const indexPrimeraVenta = indexUltimaVenta - ventasPorPagina;
  const ventasActuales = ventas.slice(indexPrimeraVenta, indexUltimaVenta);
  const totalPaginas = Math.ceil(ventas.length / ventasPorPagina);

  // Lógica para la paginación de embutidos
  const indexUltimoEmbutido = currentPageEmbutidos * embutidosPorPagina;
  const indexPrimerEmbutido = indexUltimoEmbutido - embutidosPorPagina;
  const embutidosActuales = embutidosFiltrados.slice(indexPrimerEmbutido, indexUltimoEmbutido);
  const totalPaginasEmbutidos = Math.ceil(embutidosFiltrados.length / embutidosPorPagina);

  const cambiarPagina = (numeroPagina) => {
    if (numeroPagina < 1 || numeroPagina > totalPaginas) {
      return;
    }
    setCurrentPage(numeroPagina);
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
      <NavBarUser />
      <h1 className="titulo">Venta de Embutidos</h1>
      
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
      
      {/* Barra de búsqueda para embutidos */}
      <div className="barra-busqueda">
        <input 
          type="text" 
          placeholder="Buscar embutido por nombre..." 
          value={busquedaEmbutidos}
          onChange={(e) => setBusquedaEmbutidos(e.target.value)}
          className="input-busqueda"
        />
      </div>
      
      <table className="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Precio por 100 gramos</th>
            <th>Stock (g)</th>
          </tr>
        </thead>
        <tbody>
          {embutidosActuales && embutidosActuales.map((embutido) => (
            <tr key={embutido._id} className={embutido.stockGramos <= 300 ? "fila-alerta" : ""}>
              <td>{embutido.nombre}</td>
              <td>${embutido.precioPorCienGramos}</td>
              <td>{embutido.stockGramos}g</td>
            </tr>
          ))}
        </tbody>
      </table>
      
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
        Mostrando {embutidosFiltrados.length > 0 ? indexPrimerEmbutido + 1 : 0} a {Math.min(indexUltimoEmbutido, embutidosFiltrados.length)} de {embutidosFiltrados.length} embutidos
      </div>

      {/* Vender Embutido */}
      <div className="formulario">
        <h2 className="titulo">Vender Embutido</h2>
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
  <label htmlFor="embutido">Seleccionar Embutido:</label>
  <select
    id="embutido"
    value={venta.embutidoId}
    onChange={(e) => setVenta({ ...venta, embutidoId: e.target.value })}
  >
    <option value="">Seleccionar Embutido</option>
    {embutidos && embutidos.map((embutido) => (
      <option 
        value={embutido._id} 
        key={embutido._id}
        data-stock={embutido.stockGramos <= 300 ? "bajo" : "normal"}
      >
        {embutido.nombre} - {embutido.stockGramos}g disponibles
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
        <button onClick={handleVender} className="boton-vender">
          Vender
        </button>
      </div>

      {/* Listar Ventas con Paginación */}
      <div className="section">
        <h2 className="titulo">Ventas Realizadas</h2>
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Embutido</th>
                <th>Gramos</th>
                <th>Precio por 100g</th>
                <th>Total</th>
                <th>Fecha</th>
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
                    <td>{venta.createdAt ? formatearFecha(venta.createdAt) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Componente de Paginación */}
        {ventas.length > 0 && (
          <div className="paginacion">
            <button 
              className={`paginacion-boton ${currentPage === 1 ? 'disabled' : ''}`}
              onClick={() => cambiarPagina(1)}
              disabled={currentPage === 1}
            >
              &laquo;
            </button>
            <button 
              className={`paginacion-boton ${currentPage === 1 ? 'disabled' : ''}`}
              onClick={() => cambiarPagina(currentPage - 1)}
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            
            {paginasVisibles.map(numero => (
              <button
                key={numero}
                className={`paginacion-boton ${currentPage === numero ? 'activo' : ''}`}
                onClick={() => cambiarPagina(numero)}
              >
                {numero}
              </button>
            ))}
            
            <button 
              className={`paginacion-boton ${currentPage === totalPaginas ? 'disabled' : ''}`}
              onClick={() => cambiarPagina(currentPage + 1)}
              disabled={currentPage === totalPaginas}
            >
              &gt;
            </button>
            <button 
              className={`paginacion-boton ${currentPage === totalPaginas ? 'disabled' : ''}`}
              onClick={() => cambiarPagina(totalPaginas)}
              disabled={currentPage === totalPaginas}
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

export default EmbutidosUser;