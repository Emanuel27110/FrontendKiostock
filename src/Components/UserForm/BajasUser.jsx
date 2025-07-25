import React, { useEffect, useState, useRef } from "react";
import {
  fetchBajas,
  createBaja,
  deleteBaja,
  fetchEstadisticasBajas,
  updateBaja,
  fetchProductos,
  fetchUserProfile
} from "./bajasService";
import NavBarUser from "../NavBarForm/NavBarUser.jsx";
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
import "./BajasUser.css";

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
    "Registrado por": item.user?.nombre || item.user?.username || "N/A"
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
    item.user?.nombre || item.user?.username || "N/A"
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

const BajasUser = () => {
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
        await cargarProductos();
        await cargarEstadisticas();
        await cargarUsuarioActual();
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        // El error ya se maneja en los services individuales
      }
    };

    verificarAutenticacion();
  }, []);

  // Función para cargar el usuario actual usando el service
  const cargarUsuarioActual = async () => {
    try {
      const userData = await fetchUserProfile();
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
      // El manejo de errores se hace en el service
    }
  };

  const cargarProductos = async () => {
    try {
      const productosData = await fetchProductos();
      setProductos(productosData);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      // El manejo de errores se hace en el service
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const estadisticasData = await fetchEstadisticasBajas();
      setEstadisticas(estadisticasData);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
      // El manejo de errores se hace en el service
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
        console.error("Error al eliminar baja:", error);
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
      <NavBarUser />
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
        <button className="btn-estadisticas" onClick={toggleEstadisticas}>
          <FontAwesomeIcon icon={faChartPie} />
          {mostrarEstadisticas ? "Ocultar" : "Mostrar"} Estadísticas
        </button>
        
        <button className="btn-exportar" onClick={() => exportarExcel(bajasFiltradas)}>
          <FontAwesomeIcon icon={faFileExcel} />
          Exportar Excel
        </button>
        
        <button className="btn-exportar" onClick={() => exportarPDF(bajasFiltradas)}>
          <FontAwesomeIcon icon={faFilePdf} />
          Exportar PDF
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
                  <td>{baja.user?.nombre || baja.user?.username || "N/A"}</td>
                  <td className="acciones-celda">
                    {/* Solo mostrar acciones si el usuario actual es el que creó la baja */}
                    {usuarioActual && baja.user && 
                     (usuarioActual._id === baja.user._id || usuarioActual.id === baja.user._id) && (
                      <>
                        <button 
                          className="btn-editar"
                          onClick={() => manejarEditar(baja)}
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faPencilAlt} />
                        </button>
                        <button 
                          className="btn-eliminar"
                          onClick={() => manejarEliminar(baja._id)}
                          title="Eliminar"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    )}
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

export default BajasUser;