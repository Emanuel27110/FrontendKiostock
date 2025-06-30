import React, { useState, useEffect } from "react";
import {
  FaBuilding, FaUserTie, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaGlobe, FaIdCard, FaList, FaMoneyBillWave, FaSave,
  FaTimes, FaSearch, FaTrashAlt, FaPen, FaPlus, FaChartBar,
  FaHistory, FaArrowLeft, FaCalendarAlt, FaFileInvoice,
  FaShoppingCart
} from "react-icons/fa";
import { 
  getProveedores, 
  createProveedor, 
  updateProveedor, 
  deleteProveedor,
  getDashboardStats,
  getEstadisticasCompras 
} from "./proveedoresService";
import NavBarForm from "../NavBarForm/NavBarForm";
import "./Proveedores.css";
import Swal from 'sweetalert2';

const Proveedores = () => {
  // Estado principal
  const [proveedores, setProveedores] = useState([]);
  const [proveedoresFiltrados, setProveedoresFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para formulario
  const [modoFormulario, setModoFormulario] = useState(false);
  const [proveedorActual, setProveedorActual] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    sitioWeb: "",
    cuit: "",
    categoria: "",
    condicionesPago: "",
    notas: ""
  });
  
  // Estado para vistas
  const [vistaActual, setVistaActual] = useState("lista"); // lista, historial, dashboard
  
  // Estado para dashboard
  const [datosDashboard, setDatosDashboard] = useState({
    resumenProveedores: [],
    comprasPorMes: []
  });
  
  // Estado para historial
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [historialCompras, setHistorialCompras] = useState([]);

  // Cargar proveedores al iniciar
  useEffect(() => {
    cargarProveedores();
  }, []);

  // Filtrar proveedores cuando cambia la búsqueda
  useEffect(() => {
    if (busqueda.trim() === '') {
      setProveedoresFiltrados(proveedores);
    } else {
      const filtrados = proveedores.filter(proveedor => 
        proveedor.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        proveedor.categoria?.toLowerCase().includes(busqueda.toLowerCase()) ||
        proveedor.contacto?.toLowerCase().includes(busqueda.toLowerCase())
      );
      setProveedoresFiltrados(filtrados);
    }
  }, [busqueda, proveedores]);

  // Función para cargar proveedores
  const cargarProveedores = async () => {
    setIsLoading(true);
    try {
      const data = await getProveedores();
      // Filtramos solo los proveedores activos (si el backend no lo hace)
      const proveedoresActivos = data.filter(proveedor => proveedor.activo !== false);
      setProveedores(proveedoresActivos);
      setProveedoresFiltrados(proveedoresActivos);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      mostrarError("No se pudieron cargar los proveedores");
    } finally {
      setIsLoading(false);
    }
  };

  // Función para mostrar errores
  const mostrarError = (mensaje) => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: mensaje
    });
  };

  // Función para mostrar éxito
  const mostrarExito = (titulo, mensaje) => {
    Swal.fire({
      icon: "success",
      title: titulo,
      text: mensaje
    });
  };

  // Función para limpiar formulario
  const limpiarFormulario = () => {
    setProveedorActual({
      nombre: "",
      contacto: "",
      telefono: "",
      email: "",
      direccion: "",
      sitioWeb: "",
      cuit: "",
      categoria: "",
      condicionesPago: "",
      notas: ""
    });
  };

  // Handlers para la búsqueda
  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };

  const limpiarBusqueda = () => {
    setBusqueda("");
  };

  // Handler para cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setProveedorActual(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler para abrir formulario de nuevo proveedor
  const abrirFormularioNuevo = () => {
    limpiarFormulario();
    setModoFormulario(true);
    setVistaActual("lista");
  };

  // Handler para abrir formulario de editar proveedor
  const abrirFormularioEditar = (proveedor) => {
    setProveedorActual({
      ...proveedor,
      // Asegurar que todos los campos estén presentes
      nombre: proveedor.nombre || "",
      contacto: proveedor.contacto || "",
      telefono: proveedor.telefono || "",
      email: proveedor.email || "",
      direccion: proveedor.direccion || "",
      sitioWeb: proveedor.sitioWeb || "",
      cuit: proveedor.cuit || "",
      categoria: proveedor.categoria || "",
      condicionesPago: proveedor.condicionesPago || "",
      notas: proveedor.notas || ""
    });
    setModoFormulario(true);
    setVistaActual("lista");
  };

  // Handler para cancelar el formulario
  const cancelarFormulario = () => {
    setModoFormulario(false);
    limpiarFormulario();
  };

  // Handler para enviar el formulario
  const enviarFormulario = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Si el proveedor tiene ID, actualizamos, sino creamos
      if (proveedorActual._id) {
        await updateProveedor(proveedorActual._id, proveedorActual);
        mostrarExito("Proveedor actualizado", "El proveedor ha sido actualizado correctamente");
      } else {
        await createProveedor(proveedorActual);
        mostrarExito("Proveedor creado", "El proveedor ha sido creado correctamente");
      }
      
      await cargarProveedores();
      setModoFormulario(false);
      limpiarFormulario();
    } catch (error) {
      console.error("Error al guardar proveedor:", error);
      mostrarError(`No se pudo guardar el proveedor: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para eliminar proveedor - CORREGIDO
  const eliminarProveedor = async (id) => {
    // Verificar que el ID exista
    if (!id) {
      mostrarError("ID de proveedor no válido");
      return;
    }

    // Confirmar antes de eliminar
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        await deleteProveedor(id);
        mostrarExito("Proveedor eliminado", "El proveedor ha sido eliminado correctamente");
        await cargarProveedores();
      } catch (error) {
        console.error("Error al eliminar proveedor:", error);
        mostrarError(`No se pudo eliminar el proveedor: ${error.response?.data?.message || error.message || 'Error desconocido'}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Función para formatear moneda
  const formatoMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(valor);
  };

  // Handler para ver historial de compras
  const verHistorialCompras = async (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setIsLoading(true);
    
    try {
      // Simulamos obtener el historial (como mencionaste que no existe realmente)
      // En un caso real, aquí llamarías a tu API
      setTimeout(() => {
        // Datos de ejemplo para mostrar la interfaz
        const historialEjemplo = [
          {
            _id: "1",
            fechaCompra: new Date(),
            numeroFactura: "F-001",
            productos: [
              { descripcion: "Producto ejemplo 1", cantidad: 2, precioUnitario: 1500 },
              { descripcion: "Producto ejemplo 2", cantidad: 1, precioUnitario: 3000 }
            ],
            montoTotal: 6000,
            estado: "Pagado"
          }
        ];
        
        setHistorialCompras(historialEjemplo);
        setVistaActual("historial");
        setIsLoading(false);
      }, 800);
    } catch (error) {
      console.error("Error al cargar historial:", error);
      mostrarError("No se pudo cargar el historial de compras");
      setIsLoading(false);
    }
  };

  // Handler para mostrar dashboard
  const mostrarDashboard = async () => {
    setIsLoading(true);
    
    try {
      // Obtenemos datos para el dashboard
      const [resumen, compras] = await Promise.all([
        getDashboardStats(),
        getEstadisticasCompras({ meses: 6 })
      ]);
      
      setDatosDashboard({
        resumenProveedores: resumen?.proveedores || [],
        comprasPorMes: compras?.comprasPorMes || []
      });
      
      setVistaActual("dashboard");
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
      mostrarError("No se pudieron cargar las estadísticas del dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para volver a la lista
  const volverALista = () => {
    setModoFormulario(false);
    setVistaActual("lista");
  };

  // Renderizar la vista actual
  const renderizarVista = () => {
    // Si está en modo formulario, mostrar formulario
    if (modoFormulario) {
      return renderizarFormulario();
    }
    
    // Si no, mostrar la vista seleccionada
    switch (vistaActual) {
      case "historial":
        return renderizarHistorial();
      case "dashboard":
        return renderizarDashboard();
      default:
        return renderizarLista();
    }
  };

  // Renderizar lista de proveedores
  const renderizarLista = () => {
    return (
      <div>
        {/* Buscador de proveedores */}
        <div className="buscador-container">
          <div className="input-search-container">
            <input 
              type="text" 
              placeholder="Buscar proveedores..." 
              value={busqueda}
              onChange={handleBusquedaChange}
              className="buscador-input"
              disabled={isLoading}
            />
            <FaSearch className="search-icon" />
          </div>
          {busqueda && (
            <button 
              className="btn-limpiar" 
              onClick={limpiarBusqueda}
              disabled={isLoading}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Lista de proveedores */}
        <div className="proveedores-list">
          {proveedoresFiltrados.length > 0 ? (
            <table className="tabla-proveedores">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Categoría</th>
                  <th>Condiciones de Pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedoresFiltrados.map((proveedor) => (
                  <tr key={proveedor._id || Math.random()}>
                    <td>{proveedor.nombre}</td>
                    <td>{proveedor.contacto}</td>
                    <td>{proveedor.telefono}</td>
                    <td>{proveedor.email}</td>
                    <td>{proveedor.categoria}</td>
                    <td>{proveedor.condicionesPago}</td>
                    <td className="acciones-cell">
                      <button 
                        className="btn-edit" 
                        onClick={() => abrirFormularioEditar(proveedor)}
                        title="Editar proveedor"
                        disabled={isLoading}
                      >
                        <FaPen />
                      </button>
                      <button 
                        className="btn-history" 
                        onClick={() => verHistorialCompras(proveedor)}
                        title="Ver historial de compras"
                        disabled={isLoading}
                      >
                        <FaHistory />
                      </button>
                      <button 
                        className="btn-danger" 
                        onClick={() => eliminarProveedor(proveedor._id)}
                        title="Eliminar proveedor"
                        disabled={isLoading}
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-resultados">
              {busqueda ? "No se encontraron proveedores que coincidan con la búsqueda." : "No hay proveedores registrados."}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar formulario
  const renderizarFormulario = () => {
    return (
      <div className="proveedor-form-container">
        <h3 className="form-title">
          {proveedorActual._id ? "Editar Proveedor" : "Nuevo Proveedor"}
        </h3>
        
        <form onSubmit={enviarFormulario}>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <FaBuilding /> Nombre de la empresa:
              </label>
              <input
                type="text"
                name="nombre"
                value={proveedorActual.nombre}
                onChange={handleFormChange}
                placeholder="Nombre de la empresa"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FaUserTie /> Persona de contacto:
              </label>
              <input
                type="text"
                name="contacto"
                value={proveedorActual.contacto}
                onChange={handleFormChange}
                placeholder="Nombre y apellido"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FaPhone /> Teléfono:
              </label>
              <input
                type="tel"
                name="telefono"
                value={proveedorActual.telefono}
                onChange={handleFormChange}
                placeholder="Número de teléfono"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FaEnvelope /> Email:
              </label>
              <input
                type="email"
                name="email"
                value={proveedorActual.email}
                onChange={handleFormChange}
                placeholder="Correo electrónico"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FaMapMarkerAlt /> Dirección:
              </label>
              <input
                type="text"
                name="direccion"
                value={proveedorActual.direccion}
                onChange={handleFormChange}
                placeholder="Dirección completa"
              />
            </div>

            <div className="form-group">
              <label>
                <FaGlobe /> Sitio Web:
              </label>
              <input
                type="url"
                name="sitioWeb"
                value={proveedorActual.sitioWeb}
                onChange={handleFormChange}
                placeholder="https://www.ejemplo.com"
              />
            </div>

            <div className="form-group">
              <label>
                <FaIdCard /> Identificación Fiscal:
              </label>
              <input
                type="text"
                name="cuit"
                value={proveedorActual.cuit}
                onChange={handleFormChange}
                placeholder="CUIT/RUT/NIF"
              />
            </div>

            <div className="form-group">
              <label>
                <FaList /> Categoría de productos:
              </label>
              <input
                type="text"
                name="categoria"
                value={proveedorActual.categoria}
                onChange={handleFormChange}
                placeholder="Electrónica, Alimentos, etc."
                required
              />
            </div>

            <div className="form-group">
              <label>
                <FaMoneyBillWave /> Condiciones de pago:
              </label>
              <select
                name="condicionesPago"
                value={proveedorActual.condicionesPago}
                onChange={handleFormChange}
                required
              >
                <option value="">Seleccione una opción</option>
                <option value="Contado">Contado</option>
                <option value="30 días">30 días</option>
                <option value="60 días">60 días</option>
                <option value="90 días">90 días</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Notas:</label>
              <textarea
                name="notas"
                value={proveedorActual.notas || ""}
                onChange={handleFormChange}
                placeholder="Notas adicionales sobre el proveedor"
                rows="3"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={cancelarFormulario}>
              <FaTimes /> Cancelar
            </button>
            <button type="submit" className="btn-primary">
              <FaSave /> {proveedorActual._id ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Renderizar historial de compras
  const renderizarHistorial = () => {
    if (!proveedorSeleccionado) return null;
    
    return (
      <div className="historial-container">
        <div className="historial-header">
          <h3>
            <FaHistory /> Historial de Compras - {proveedorSeleccionado.nombre}
          </h3>
          <button className="btn-back" onClick={volverALista}>
            <FaArrowLeft /> Volver
          </button>
        </div>
        
        <div className="info-proveedor">
          <p><strong>Contacto:</strong> {proveedorSeleccionado.contacto}</p>
          <p><strong>Teléfono:</strong> {proveedorSeleccionado.telefono}</p>
          <p><strong>Email:</strong> {proveedorSeleccionado.email}</p>
        </div>
        
        {historialCompras && historialCompras.length > 0 ? (
          <div className="compras-table-container">
            <table className="tabla-historial">
              <thead>
                <tr>
                  <th><FaCalendarAlt /> Fecha</th>
                  <th><FaFileInvoice /> Nº Factura</th>
                  <th>Productos</th>
                  <th><FaMoneyBillWave /> Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historialCompras.map((compra) => (
                  <tr key={compra._id}>
                    <td>
                      {new Date(compra.fechaCompra).toLocaleString('es-AR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                    <td>{compra.numeroFactura}</td>
                    <td>
                      <ul className="productos-lista">
                        {compra.productos.map((producto, index) => (
                          <li key={index}>
                            {producto.descripcion} - Cantidad: {producto.cantidad} - Precio: ${producto.precioUnitario}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="total-column">${compra.montoTotal.toFixed(2)}</td>
                    <td>
                      <span className={`estado-badge estado-${compra.estado.toLowerCase()}`}>
                        {compra.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-resultados">
            No hay historial de compras para este proveedor.
          </div>
        )}
      </div>
    );
  };

  // Renderizar dashboard
  const renderizarDashboard = () => {
    // Obtener datos para el dashboard
    const { resumenProveedores, comprasPorMes } = datosDashboard;
    
    // Top 5 proveedores
    const topProveedores = resumenProveedores
      .sort((a, b) => b.totalCompras - a.totalCompras)
      .slice(0, 5);
    
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h3>
            <FaChartBar /> Dashboard de Proveedores
          </h3>
          <button className="btn-back" onClick={volverALista}>
            <FaArrowLeft /> Volver
          </button>
        </div>

        <div className="dashboard-cards">
          <div className="card">
            <div className="card-icon">
              <FaShoppingCart />
            </div>
            <div className="card-content">
              <h4>Total Proveedores</h4>
              <p className="card-value">{proveedores.length}</p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-icon">
              <FaMoneyBillWave />
            </div>
            <div className="card-content">
              <h4>Total Compras</h4>
              <p className="card-value">
                {formatoMoneda(resumenProveedores.reduce((total, p) => total + p.totalCompras, 0))}
              </p>
            </div>
          </div>
          
          <div className="card">
            <div className="card-icon">
              <FaCalendarAlt />
            </div>
            <div className="card-content">
              <h4>Compras Último Mes</h4>
              <p className="card-value">
                {formatoMoneda(comprasPorMes.length > 0 ? comprasPorMes[comprasPorMes.length - 1].total : 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
          <div className="section">
            <h4>Top 5 Proveedores por Volumen de Compras</h4>
            {topProveedores.length > 0 ? (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Categoría</th>
                    <th>Compras Totales</th>
                    <th>Última Compra</th>
                  </tr>
                </thead>
                <tbody>
                  {topProveedores.map((proveedor) => (
                    <tr key={proveedor.proveedorId}>
                      <td>{proveedor.nombre}</td>
                      <td>{proveedor.categoria}</td>
                      <td>{formatoMoneda(proveedor.totalCompras)}</td>
                      <td>
                        {proveedor.ultimaCompra ? new Date(proveedor.ultimaCompra).toLocaleDateString('es-AR') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-data">No hay datos de compras disponibles</p>
            )}
          </div>

          <div className="section">
            <h4>Compras por Mes (Últimos 6 meses)</h4>
            {comprasPorMes.length > 0 ? (
              <div className="grafico-barras">
                {comprasPorMes.map((mes) => (
                  <div className="barra-container" key={mes.mes}>
                    <div 
                      className="barra" 
                      style={{ 
                        height: `${(mes.total / Math.max(...comprasPorMes.map(m => m.total))) * 100}%`
                      }}
                    >
                      <span className="barra-valor">{formatoMoneda(mes.total)}</span>
                    </div>
                    <span className="barra-etiqueta">{mes.mes}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No hay datos de compras mensuales disponibles</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="proveedores-container">
      <NavBarForm />
      
      <h1>Proveedores</h1>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Cargando...</p>
        </div>
      )}
      
      {/* Header with navigation buttons */}
      <div className="proveedores-header">
        <h2><FaBuilding /> Gestión de Proveedores</h2>
        <div className="proveedores-actions">
          <button 
            className={`btn-tab ${vistaActual === "lista" && !modoFormulario ? "active" : ""}`} 
            onClick={volverALista}  
            disabled={isLoading}
          >
            <FaList /> Lista de Proveedores
          </button>
          <button 
            className="btn-primary" 
            onClick={abrirFormularioNuevo}
            disabled={isLoading || modoFormulario}  
          >
            <FaPlus /> Nuevo Proveedor
          </button>
          <button 
            className={`btn-tab ${vistaActual === "dashboard" ? "active" : ""}`} 
            onClick={mostrarDashboard}
            disabled={isLoading || modoFormulario}  
          >
            <FaChartBar /> Dashboard
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      {renderizarVista()}
    </div>
  );
};

export default Proveedores;