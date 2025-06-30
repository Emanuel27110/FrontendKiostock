import React, { useEffect, useState, useRef } from "react";
import {
  fetchBajas,
  createBaja,
  deleteBaja,
  fetchEstadisticasBajas,
  updateBaja
} from "./bajasService";
import NavBarForm from "../NavBarForm/NavBarForm";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faTrash,
  faFileExcel,
  faFilePdf,
  faChartPie,
  faExclamationTriangle,
  faPencilAlt
} from "@fortawesome/free-solid-svg-icons";
import "./Bajas.css"; // Tendremos que crear este archivo CSS

// Añadimos las dependencias que necesitaríamos para exportar (asumimos que están instaladas)
// Si no están instaladas, necesitarás ejecutar: npm install xlsx jspdf jspdf-autotable
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const motivos = ["vencimiento", "rotura", "defecto", "otro"];

// Función para traducir motivos (movida directamente al componente)
const traducirMotivo = (motivo) => {
  const traducciones = {
    vencimiento: "Vencimiento",
    rotura: "Rotura",
    defecto: "Defecto",
    otro: "Otro"
  };
  return traducciones[motivo] || motivo;
};

// Funciones de exportación integradas en el componente
const exportarExcel = (datos) => {
  const listaFormateada = datos.map(item => ({
    Fecha: new Date(item.createdAt).toLocaleDateString(),
    Producto: item.producto?.descripcion || 'N/A',
    Cantidad: item.cantidad || 0,
    Motivo: traducirMotivo(item.motivo || ''),
    Descripcion: item.descripcion || '',
    "Valor Perdido": `$${(item.valorPerdida || 0).toFixed(2)}`,
    "Registrado por": item.user?.nombre || "N/A"
  }));

  const worksheet = XLSX.utils.json_to_sheet(listaFormateada);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bajas");
  
  // Ajustar anchos de columnas
  const colsWidth = [
    { wch: 15 }, // Fecha
    { wch: 30 }, // Producto
    { wch: 10 }, // Cantidad
    { wch: 15 }, // Motivo
    { wch: 40 }, // Descripción
    { wch: 15 }, // Valor Perdido
    { wch: 20 }  // Registrado por
  ];
  
  worksheet['!cols'] = colsWidth;
  
  // Guardar el archivo
  XLSX.writeFile(workbook, "Reporte_Bajas.xlsx");
};

const exportarPDF = (datos) => {
  const doc = new jsPDF('landscape');
  
  // Título
  doc.setFontSize(18);
  doc.text("Reporte de Bajas de Inventario", 14, 22);
  doc.setFontSize(11);
  
  // Fecha de generación
  const hoy = new Date().toLocaleDateString();
  doc.text(`Generado: ${hoy}`, 14, 30);
  
  // Preparar datos para la tabla
  const rows = datos.map(item => [
    new Date(item.createdAt).toLocaleDateString(),
    item.producto?.descripcion || 'N/A',
    (item.cantidad || 0).toString(),
    traducirMotivo(item.motivo || ''),
    item.descripcion && item.descripcion.length > 30 
      ? item.descripcion.substring(0, 30) + "..." 
      : (item.descripcion || ''),
    `$${(item.valorPerdida || 0).toFixed(2)}`,
    item.user?.nombre || "N/A"
  ]);
  
  // Crear tabla
  doc.autoTable({
    startY: 35,
    head: [['Fecha', 'Producto', 'Cantidad', 'Motivo', 'Descripción', 'Valor Perdido', 'Registrado por']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202] },
    styles: { overflow: 'ellipsize' },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 60 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 70 },
      5: { cellWidth: 25 },
      6: { cellWidth: 30 }
    }
  });
  
  // Guardar archivo PDF
  doc.save("Reporte_Bajas.pdf");
};

// Función fetchProductos modificada para usar credentials: 'include'
const fetchProductos = async () => {
  try {
    const response = await fetch('http://localhost:4000/api/productos', {
      credentials: 'include',  // Para enviar cookies de sesión
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // Redirigir al login si hay error de autenticación
        Swal.fire({
          icon: 'error',
          title: 'Sesión expirada',
          text: 'Por favor, inicie sesión nuevamente',
          confirmButtonText: 'Ir al login'
        }).then(() => {
          window.location.href = '/login';
        });
        throw new Error('Error de autenticación');
      }
      throw new Error('Error al obtener productos');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al cargar productos:', error);
    throw error;
  }
};

const Bajas = () => {
  const [bajas, setBajas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [motivosFiltrados, setMotivosFiltrados] = useState(["Todos"]);
  const [formBaja, setFormBaja] = useState({
    productoId: "",
    cantidad: 1,
    motivo: "",
    descripcion: "",
  });
  const [paginaActual, setPaginaActual] = useState(1);
  const [bajasPorPagina] = useState(10);
  const [estadisticas, setEstadisticas] = useState(null);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const tablaRef = useRef(null);

  // Nuevos estados para edición
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);

  useEffect(() => {
    const verificarAutenticacion = async () => {
      try {
        // Intentar cargar datos para verificar autenticación
        await cargarBajas();
        cargarProductos();
        cargarEstadisticas();
        cargarUsuarioActual(); // Nuevo: obtener información del usuario actual
      } catch (error) {
        if (error.response && error.response.status === 401) {
          Swal.fire({
            icon: 'error',
            title: 'Sesión expirada',
            text: 'Por favor, inicie sesión nuevamente',
            confirmButtonText: 'Ir al login'
          }).then(() => {
            window.location.href = '/login';
          });
        }
      }
    };

    verificarAutenticacion();
  }, []);

  // Nueva función para cargar el usuario actual
  const cargarUsuarioActual = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/profile', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener perfil de usuario');
      }
      
      const userData = await response.json();
      setUsuarioActual(userData);
    } catch (error) {
      console.error("Error al cargar usuario actual:", error);
    }
  };

  const cargarBajas = async () => {
    try {
      const bajasData = await fetchBajas();
      setBajas(bajasData);
    } catch (error) {
      console.error("Error al cargar bajas:", error);
      if (!error.response || error.response.status !== 401) {
        // No mostrar este mensaje si es un error de autenticación
        // ya que se maneja en fetchBajas
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar las bajas. Intente nuevamente.",
        });
      }
      throw error;
    }
  };

  const cargarProductos = async () => {
    try {
      const productosData = await fetchProductos();
      setProductos(productosData);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      // El manejo específico de 401 se hace en fetchProductos
      throw error;
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const estadisticasData = await fetchEstadisticasBajas();
      setEstadisticas(estadisticasData);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      // No se muestra alerta, ya que el error 401 se maneja en el servicio
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormBaja((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formBaja.productoId) {
      return Swal.fire({
        icon: "error",
        title: "Error",
        text: "Debe seleccionar un producto",
      });
    }

    if (!formBaja.motivo) {
      return Swal.fire({
        icon: "error",
        title: "Error",
        text: "Debe seleccionar un motivo",
      });
    }

    if (parseInt(formBaja.cantidad) <= 0) {
      return Swal.fire({
        icon: "error",
        title: "Error",
        text: "La cantidad debe ser mayor a cero",
      });
    }

    if (!formBaja.descripcion.trim()) {
      return Swal.fire({
        icon: "error",
        title: "Error",
        text: "Debe proporcionar una descripción",
      });
    }

    try {
      if (editando) {
        // Si estamos editando, actualizamos
        await updateBaja(idEditando, formBaja);
        Swal.fire({
          icon: "success",
          title: "Baja actualizada",
          text: "La baja de producto ha sido actualizada correctamente.",
        });
        // Salir del modo edición
        setEditando(false);
        setIdEditando(null);
      } else {
        // Si estamos creando, creamos nueva baja
        await createBaja(formBaja);
        Swal.fire({
          icon: "success",
          title: "Baja registrada",
          text: "La baja de producto ha sido registrada correctamente.",
        });
      }
      
      // Resetear formulario
      setFormBaja({
        productoId: "",
        cantidad: 1,
        motivo: "",
        descripcion: "",
      });
      
      // Recargar datos
      await cargarBajas();
      await cargarEstadisticas();
    } catch (error) {
      console.error("Error al procesar baja:", error);
      
      // Mostrar mensaje específico si es error de stock
      if (error.response && error.response.data && error.response.status === 400) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response.data.message || "Error al procesar la baja",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo procesar la baja. Intente nuevamente.",
        });
      }
    }
  };

  // Nueva función para editar
  const manejarEditar = (baja) => {
    setFormBaja({
      productoId: baja.producto?._id || "",
      cantidad: baja.cantidad || 1,
      motivo: baja.motivo || "",
      descripcion: baja.descripcion || "",
    });
    setEditando(true);
    setIdEditando(baja._id);
    
    // Hacer scroll hasta el formulario
    window.scrollTo({
      top: document.querySelector('.form-baja-container').offsetTop,
      behavior: 'smooth'
    });
  };

  // Función para cancelar edición
  const cancelarEdicion = () => {
    setEditando(false);
    setIdEditando(null);
    setFormBaja({
      productoId: "",
      cantidad: 1,
      motivo: "",
      descripcion: "",
    });
  };

  const manejarEliminar = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡Esta acción no se puede deshacer!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteBaja(id);
        
        Swal.fire({
          icon: "success",
          title: "Baja eliminada",
          text: "La baja ha sido eliminada correctamente.",
        });
        
        await cargarBajas();
        await cargarEstadisticas();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar la baja. Intente nuevamente.",
        });
      }
    }
  };

  const toggleMotivo = (motivo) => {
    if (motivo === "Todos") {
      setMotivosFiltrados(["Todos"]);
    } else {
      setMotivosFiltrados(prev => {
        const newSelection = prev.includes("Todos") ? [] : prev.filter(m => m !== "Todos");
        
        if (newSelection.includes(motivo)) {
          const result = newSelection.filter(m => m !== motivo);
          return result.length === 0 ? ["Todos"] : result;
        } else {
          return [...newSelection, motivo];
        }
      });
    }
  };

  // FUNCIÓN CORREGIDA: bajasFiltradas con verificaciones de null/undefined
  const bajasFiltradas = bajas.filter((baja) => {
    // Verificaciones de null/undefined antes de acceder a las propiedades
    if (!baja) return false;
    
    const productoDescripcion = baja.producto?.descripcion || '';
    const bajaDescripcion = baja.descripcion || '';
    const busquedaLower = busqueda.toLowerCase();
    
    // Filtro por texto (busca en descripción del producto o en descripción de la baja)
    const coincideTexto = 
      productoDescripcion.toLowerCase().includes(busquedaLower) ||
      bajaDescripcion.toLowerCase().includes(busquedaLower);
    
    // Filtro por motivos - también verificar que motivo existe
    const motivoBaja = baja.motivo || '';
    const coincideMotivo = motivosFiltrados.includes("Todos") || motivosFiltrados.includes(motivoBaja);
    
    return coincideTexto && coincideMotivo;
  });

  const indexUltimaBaja = paginaActual * bajasPorPagina;
  const indexPrimeraBaja = indexUltimaBaja - bajasPorPagina;
  const bajasPaginadas = bajasFiltradas.slice(indexPrimeraBaja, indexUltimaBaja);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return 'N/A';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleEstadisticas = () => {
    setMostrarEstadisticas(!mostrarEstadisticas);
  };

  return (
    <div className="bajas-container">
      <NavBarForm />
      <h1>Bajas de Inventario</h1>

      <div className="input-busqueda-container">
        <input
          type="text"
          placeholder="Buscar por producto o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <FontAwesomeIcon icon={faSearch} className="icono-busqueda" />
      </div>

      <div className="botones-accion">
        <button onClick={() => exportarExcel(bajas)} className="btn-exportar">
          <FontAwesomeIcon icon={faFileExcel} /> Exportar a Excel
        </button>
        <button onClick={() => exportarPDF(bajas)} className="btn-exportar">
          <FontAwesomeIcon icon={faFilePdf} /> Exportar a PDF
        </button>
        <button onClick={toggleEstadisticas} className="btn-estadisticas">
          <FontAwesomeIcon icon={faChartPie} /> {mostrarEstadisticas ? 'Ocultar Estadísticas' : 'Ver Estadísticas'}
        </button>
      </div>

      {mostrarEstadisticas && estadisticas && (
        <div className="estadisticas-container">
          <h2>Estadísticas de Bajas</h2>
          
          <div className="estadisticas-cards">
            <div className="estadistica-card total">
              <h3>Total de Pérdidas</h3>
              <p className="valor">${estadisticas.total?.total?.toFixed(2) || '0.00'}</p>
              <p>Cantidad: {estadisticas.total?.cantidadTotal || 0} unidades</p>
              <p>Total de bajas: {estadisticas.total?.countTotal || 0}</p>
            </div>

            {estadisticas.porMotivo?.map(motivo => (
              <div className="estadistica-card" key={motivo._id}>
                <h3>{traducirMotivo(motivo._id)}</h3>
                <p className="valor">${(motivo.valorTotal || 0).toFixed(2)}</p>
                <p>Cantidad: {motivo.cantidad || 0} unidades</p>
                <p>Registros: {motivo.count || 0}</p>
              </div>
            )) || []}
          </div>

          <div className="productos-mas-bajas">
            <h3>Productos con más bajas</h3>
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Valor Perdido</th>
                </tr>
              </thead>
              <tbody>
                {estadisticas.productosMasBajas?.map(producto => (
                  <tr key={producto._id}>
                    <td>{producto.descripcion || 'N/A'}</td>
                    <td>{producto.cantidad || 0}</td>
                    <td>${(producto.valorTotal || 0).toFixed(2)}</td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="form-baja-container">
        <h2>{editando ? "Editar Baja" : "Registrar Nueva Baja"}</h2>
        <form onSubmit={manejarEnvio}>
          <div className="form-group">
            <label>Producto</label>
            <select
              name="productoId"
              value={formBaja.productoId}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione un producto</option>
              {productos.map((producto) => (
                <option key={producto._id} value={producto._id}>
                  {producto.descripcion || 'Producto sin descripción'} - Stock: {producto.stock || 0}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Cantidad</label>
            <input
              type="number"
              name="cantidad"
              value={formBaja.cantidad}
              onChange={manejarCambio}
              min="1"
              step="1"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Motivo</label>
            <select
              name="motivo"
              value={formBaja.motivo}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione un motivo</option>
              {motivos.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {traducirMotivo(motivo)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={formBaja.descripcion}
              onChange={manejarCambio}
              placeholder="Explique el motivo de la baja..."
              required
            />
          </div>
          
          <div className="botones-form">
            <button type="submit" className="btn-registrar">
              {editando ? "Actualizar Baja" : "Registrar Baja"}
            </button>
            
            {editando && (
              <button 
                type="button" 
                className="btn-cancelar" 
                onClick={cancelarEdicion}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <h2>Historial de Bajas</h2>

      <div className="input-filtro-motivo">
        <label>Filtrar por Motivos:</label>
        <div className="chips-container">
          {["Todos", ...motivos].map((motivo) => (
            <div
              key={motivo}
              className={`chip ${motivosFiltrados.includes(motivo) ? "selected" : ""}`}
              onClick={() => toggleMotivo(motivo)}
            >
              {motivo === "Todos" ? "Todos" : traducirMotivo(motivo)}
            </div>
          ))}
        </div>
      </div>

      <div ref={tablaRef} className="tabla-bajas">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Motivo</th>
              <th>Descripción</th>
              <th>Valor Perdido</th>
              <th>Registrado por</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bajasPaginadas.length > 0 ? (
              bajasPaginadas.map((baja) => (
                <tr key={baja._id}>
                  <td>{formatearFecha(baja.createdAt)}</td>
                  <td>{baja.producto?.descripcion || 'N/A'}</td>
                  <td>{baja.cantidad || 0}</td>
                  <td>{traducirMotivo(baja.motivo || '')}</td>
                  <td className="descripcion-celda">{baja.descripcion || ''}</td>
                  <td className="valor-celda">${(baja.valorPerdida || 0).toFixed(2)}</td>
                  <td>{baja.user?.nombre || "N/A"}</td>
                  <td className="acciones-container">
                    <button
                      onClick={() => manejarEditar(baja)}
                      className="btn-editar"
                      title="Editar baja"
                    >
                      <FontAwesomeIcon icon={faPencilAlt} />
                    </button>
                    <button
                      onClick={() => manejarEliminar(baja._id)}
                      className="btn-eliminar"
                      title="Eliminar baja"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-registros">
                  <FontAwesomeIcon icon={faExclamationTriangle} /> No hay registros que coincidan con los filtros aplicados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="paginacion">
        {Array.from({ length: Math.ceil(bajasFiltradas.length / bajasPorPagina) }).map((_, index) => (
          <button
            key={index}
            onClick={() => cambiarPagina(index + 1)}
            className={`pagina ${paginaActual === index + 1 ? "active" : ""}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Bajas;