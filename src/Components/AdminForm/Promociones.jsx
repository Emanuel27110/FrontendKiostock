import React, { useEffect, useState, useReducer } from "react";
import NavBarForm from "../NavBarForm/NavBarForm";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPen,
  faTrash,
  faCalendarAlt,
  faChartLine,
  faCheck,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import "./Promociones.css";
import {
  fetchProductos,
  createPromocion,
  fetchPromociones,
  updatePromocion,
  deletePromocion,
  finalizarPromocion,
  getEstadisticasPromocionesCompletas // Añadida la importación faltante
} from "./promocionesService";


// Actualización del formulario reductor
const formularioReducer = (state, action) => {
  switch (action.type) {
    case "SET_FORM":
      return { ...state, ...action.payload };
    case "SET_PRODUCTOS":
      return { ...state, productos: action.payload };
    case "RESET_FORM":
      return {
        nombre: "",
        descripcion: "",
        tipo: "2x1",
        producto1Id: "",
        producto2Id: "",
        descuento: 0,
        cantidadMinima: 1,
        precio: 0, // Añadido campo de precio
        fechaInicio: new Date(),
        fechaFin: new Date(new Date().setDate(new Date().getDate() + 7)),
        activa: true,
        productos: []
      };
    default:
      return state;
  }
};

const tiposPromocion = ["2x1", "Descuento por volumen", "Descuento porcentaje", "Pack combo"];

const Promociones = () => {
  const [promociones, setPromociones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [promocionesPorPagina] = useState(5);
  // Estado inicial del formulario con precio
const [formPromocion, dispatch] = useReducer(formularioReducer, {
  nombre: "",
  descripcion: "",
  tipo: "2x1",
  producto1Id: "",
  producto2Id: "",
  descuento: 0,
  cantidadMinima: 1,
  precio: 0, // Añadido campo de precio
  fechaInicio: new Date(),
  fechaFin: new Date(new Date().setDate(new Date().getDate() + 7)),
  activa: true,
  productos: []
});
  const [editando, setEditando] = useState(null);
  const [vistaCalendario, setVistaCalendario] = useState(false);
  const [promocionesCalendario, setPromocionesCalendario] = useState([]);
  const [vistaEstadisticas, setVistaEstadisticas] = useState(false);
  const [fecha, setFecha] = useState(new Date());
  // Agregar al inicio del componente (después de los otros useState):
const [estadisticasCompletas, setEstadisticasCompletas] = useState(null);
const [cargandoEstadisticas, setCargandoEstadisticas] = useState(false);

  useEffect(() => {
    cargarProductos();
    cargarPromociones();
  }, []);

  useEffect(() => {
    // Actualizar promociones en calendario cuando cambian las promociones
    if (promociones.length > 0) {
      const promosCalendario = promociones.map(promo => ({
        id: promo._id,
        nombre: promo.nombre,
        fechaInicio: new Date(promo.fechaInicio),
        fechaFin: new Date(promo.fechaFin),
        activa: promo.activa
      }));
      setPromocionesCalendario(promosCalendario);
    }
  }, [promociones]);

  // Cargar estadísticas cuando se cambia a la vista de estadísticas
  useEffect(() => {
    if (vistaEstadisticas && !estadisticasCompletas) {
      cargarEstadisticasCompletas();
    }
  }, [vistaEstadisticas]);

  const cargarProductos = async () => {
    try {
      const productosData = await fetchProductos();
      setProductos(productosData);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los productos.",
      });
    }
  };

  // Agregar esta función para cargar estadísticas:
const cargarEstadisticasCompletas = async () => {
  setCargandoEstadisticas(true);
  try {
    const estadisticas = await getEstadisticasPromocionesCompletas();
    setEstadisticasCompletas(estadisticas);
  } catch (error) {
    console.error("Error al cargar estadísticas:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "No se pudieron cargar las estadísticas.",
    });
  } finally {
    setCargandoEstadisticas(false);
  }
};
  const cargarPromociones = async () => {
    try {
      const promocionesData = await fetchPromociones();
      setPromociones(promocionesData);
    } catch (error) {
      console.error("Error al cargar promociones:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las promociones.",
      });
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    dispatch({ type: "SET_FORM", payload: { [name]: value } });
  };

  const manejarCambioFecha = (fecha, tipo) => {
    dispatch({ type: "SET_FORM", payload: { [tipo]: fecha } });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    // Validaciones
    if (formPromocion.fechaInicio >= formPromocion.fechaFin) {
      Swal.fire({
        icon: "error",
        title: "Error de fechas",
        text: "La fecha de fin debe ser posterior a la fecha de inicio.",
      });
      return;
    }

    // Validación específica según el tipo de promoción
    if (formPromocion.tipo === "2x1" || formPromocion.tipo === "Pack combo") {
      if (!formPromocion.producto1Id || !formPromocion.producto2Id) {
        Swal.fire({
          icon: "error",
          title: "Productos requeridos",
          text: "Debe seleccionar ambos productos para este tipo de promoción.",
        });
        return;
      }

      if (formPromocion.producto1Id === formPromocion.producto2Id) {
        Swal.fire({
          icon: "error",
          title: "Productos duplicados",
          text: "Debe seleccionar productos diferentes para la promoción.",
        });
        return;
      }
    } else if (formPromocion.tipo === "Descuento por volumen" || formPromocion.tipo === "Descuento porcentaje") {
      if (!formPromocion.producto1Id) {
        Swal.fire({
          icon: "error",
          title: "Producto requerido",
          text: "Debe seleccionar al menos un producto para este tipo de promoción.",
        });
        return;
      }

      if (formPromocion.descuento <= 0) {
        Swal.fire({
          icon: "error",
          title: "Descuento inválido",
          text: "El descuento debe ser mayor que 0.",
        });
        return;
      }

      if (formPromocion.tipo === "Descuento por volumen" && formPromocion.cantidadMinima < 2) {
        Swal.fire({
          icon: "error",
          title: "Cantidad mínima inválida",
          text: "La cantidad mínima para descuento por volumen debe ser al menos 2.",
        });
        return;
      }
    }

    try {
      // Añadir esto en la parte donde se construye el objeto promocionData antes de guardar
const promocionData = {
  nombre: formPromocion.nombre,
  descripcion: formPromocion.descripcion,
  tipo: formPromocion.tipo,
  producto1Id: formPromocion.producto1Id,
  producto2Id: formPromocion.producto2Id || null,
  descuento: parseFloat(formPromocion.descuento) || 0,
  cantidadMinima: parseInt(formPromocion.cantidadMinima) || 1,
  precio: parseFloat(formPromocion.precio) || 0, // Añadido campo de precio
  fechaInicio: formPromocion.fechaInicio,
  fechaFin: formPromocion.fechaFin,
  activa: true,
  ventasRealizadas: 0
};
      if (editando) {
        await updatePromocion(editando, promocionData);
        Swal.fire({
          icon: "success",
          title: "Promoción actualizada",
          text: "La promoción ha sido actualizada correctamente.",
        });
      } else {
        await createPromocion(promocionData);
        Swal.fire({
          icon: "success",
          title: "Promoción creada",
          text: "La promoción ha sido creada exitosamente.",
        });
      }

      dispatch({ type: "RESET_FORM" });
      setEditando(null);
      await cargarPromociones();
    } catch (error) {
      console.error("Error al guardar la promoción:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al crear o actualizar la promoción.",
      });
    }
  };

  const manejarEditar = (promocion) => {
    dispatch({
      type: "SET_FORM",
      payload: {
        ...promocion,
        fechaInicio: new Date(promocion.fechaInicio),
        fechaFin: new Date(promocion.fechaFin)
      },
    });
    setEditando(promocion._id);
  };

  const manejarEliminar = async (id) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción no se puede deshacer!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deletePromocion(id);
        Swal.fire({
          icon: "success",
          title: "Promoción eliminada",
          text: "La promoción ha sido eliminada correctamente.",
        });
        cargarPromociones();
      } catch (error) {
        console.error("Error al eliminar promoción:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar la promoción.",
        });
      }
    }
  };

  const manejarFinalizarPromocion = async (id) => {
    const result = await Swal.fire({
      title: "Finalizar promoción",
      text: "¿Estás seguro de que quieres finalizar esta promoción? El stock restante será devuelto a los productos originales.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await finalizarPromocion(id);
        Swal.fire({
          icon: "success",
          title: "Promoción finalizada",
          text: "La promoción ha sido finalizada y el stock ha sido devuelto.",
        });
        cargarPromociones();
      } catch (error) {
        console.error("Error al finalizar promoción:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo finalizar la promoción.",
        });
      }
    }
  };

  const mostrarInfoPromocion = (promocion) => {
    const producto1 = productos.find(p => p._id === promocion.producto1Id);
    const producto2 = promocion.producto2Id ? productos.find(p => p._id === promocion.producto2Id) : null;
    
    let mensaje = "";
    
    switch(promocion.tipo) {
      case "2x1":
        mensaje = `<p><strong>Tipo:</strong> 2x1</p>
                   <p><strong>Producto 1:</strong> ${producto1?.descripcion || 'No encontrado'}</p>
                   <p><strong>Producto 2:</strong> ${producto2?.descripcion || 'No encontrado'}</p>`;
        break;
      case "Descuento por volumen":
        mensaje = `<p><strong>Tipo:</strong> Descuento por volumen</p>
                   <p><strong>Producto:</strong> ${producto1?.descripcion || 'No encontrado'}</p>
                   <p><strong>Descuento:</strong> $${promocion.descuento}</p>
                   <p><strong>Cantidad mínima:</strong> ${promocion.cantidadMinima} unidades</p>`;
        break;
      case "Descuento porcentaje":
        mensaje = `<p><strong>Tipo:</strong> Descuento porcentaje</p>
                   <p><strong>Producto:</strong> ${producto1?.descripcion || 'No encontrado'}</p>
                   <p><strong>Descuento:</strong> ${promocion.descuento}%</p>`;
        break;
      case "Pack combo":
        mensaje = `<p><strong>Tipo:</strong> Pack combo</p>
                   <p><strong>Producto 1:</strong> ${producto1?.descripcion || 'No encontrado'}</p>
                   <p><strong>Producto 2:</strong> ${producto2?.descripcion || 'No encontrado'}</p>
                   <p><strong>Descuento:</strong> $${promocion.descuento}</p>`;
        break;
      default:
        mensaje = "Información no disponible";
    }

    mensaje += `<p><strong>Ventas realizadas:</strong> ${promocion.ventasRealizadas || 0}</p>
                <p><strong>Periodo:</strong> ${new Date(promocion.fechaInicio).toLocaleDateString()} al ${new Date(promocion.fechaFin).toLocaleDateString()}</p>`;

    Swal.fire({
      title: promocion.nombre,
      html: mensaje,
      icon: "info",
      confirmButtonText: "Cerrar"
    });
  };

  const promocionesFiltradas = promociones.filter((promocion) => {
    return promocion.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
           promocion.descripcion.toLowerCase().includes(busqueda.toLowerCase());
  });

  const indexUltimaPromocion = paginaActual * promocionesPorPagina;
  const indexPrimeraPromocion = indexUltimaPromocion - promocionesPorPagina;
  const promocionesPaginadas = promocionesFiltradas.slice(
    indexPrimeraPromocion,
    indexUltimaPromocion
  );

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const promocionesEnFecha = promocionesCalendario.filter(promo => {
      const fechaActual = new Date(date);
      const inicio = new Date(promo.fechaInicio);
      const fin = new Date(promo.fechaFin);
      
      // Comparamos solo año, mes y día
      fechaActual.setHours(0,0,0,0);
      inicio.setHours(0,0,0,0);
      fin.setHours(0,0,0,0);
      
      return fechaActual >= inicio && fechaActual <= fin && promo.activa;
    });
    
    if (promocionesEnFecha.length > 0) {
      return (
        <div className="calendar-tile-content">
          <div className="dot-container">
            {promocionesEnFecha.slice(0, 3).map((promo, index) => (
              <div key={promo.id + index} className="promo-dot"></div>
            ))}
          </div>
          {promocionesEnFecha.length > 3 && <div className="more-promos">+{promocionesEnFecha.length - 3}</div>}
        </div>
      );
    }
    
    return null;
  };

  const mostrarPromocionesEnFecha = (value) => {
    const fecha = new Date(value);
    fecha.setHours(0,0,0,0);
    
    const promocionesEnFecha = promocionesCalendario.filter(promo => {
      const inicio = new Date(promo.fechaInicio);
      const fin = new Date(promo.fechaFin);
      
      inicio.setHours(0,0,0,0);
      fin.setHours(0,0,0,0);
      
      return fecha >= inicio && fecha <= fin;
    });
    
    if (promocionesEnFecha.length > 0) {
      const listaPromociones = promocionesEnFecha.map(promo => {
        const promocionCompleta = promociones.find(p => p._id === promo.id);
        return `<li><strong>${promo.nombre}</strong> - ${promocionCompleta?.activa ? 'Activa' : 'Inactiva'}</li>`;
      }).join('');
      
      Swal.fire({
        title: `Promociones del ${fecha.toLocaleDateString()}`,
        html: `<ul>${listaPromociones}</ul>`,
        icon: "info"
      });
    } else {
      Swal.fire({
        title: `${fecha.toLocaleDateString()}`,
        text: "No hay promociones programadas para esta fecha.",
        icon: "info"
      });
    }
  };

  // Determinar si se debe mostrar el segundo producto según el tipo de promoción
  const mostrarSegundoProducto = formPromocion.tipo === "2x1" || formPromocion.tipo === "Pack combo";
  
  // Determinar si se debe mostrar campos de descuento
  const mostrarDescuento = formPromocion.tipo === "Descuento por volumen" || 
                          formPromocion.tipo === "Descuento porcentaje" ||
                          formPromocion.tipo === "Pack combo";
  
  // Determinar si se debe mostrar cantidad mínima
  const mostrarCantidadMinima = formPromocion.tipo === "Descuento por volumen";

  // Esta función debe añadirse al componente Promociones.jsx

const calcularPrecioRecomendado = () => {
  const producto1 = productos.find(p => p._id === formPromocion.producto1Id);
  const producto2 = productos.find(p => p._id === formPromocion.producto2Id);
  
  if (!producto1) return 0;
  
  let precioRecomendado = 0;
  
  switch(formPromocion.tipo) {
    case "2x1":
      // Para 2x1, el precio sugerido es el precio del producto principal
      precioRecomendado = producto1.precio;
      break;
    case "Descuento por volumen":
      // Para descuento por volumen, precio unitario menos el descuento por la cantidad mínima
      precioRecomendado = (producto1.precio * formPromocion.cantidadMinima) - formPromocion.descuento;
      break;
    case "Descuento porcentaje":
      // Para descuento por porcentaje, precio menos el porcentaje de descuento
      precioRecomendado = producto1.precio * (1 - (formPromocion.descuento / 100));
      break;
    case "Pack combo":
      // Para pack combo, suma de ambos productos menos el descuento
      if (producto2) {
        precioRecomendado = (producto1.precio + producto2.precio) - formPromocion.descuento;
      } else {
        precioRecomendado = producto1.precio;
      }
      break;
    default:
      precioRecomendado = 0;
  }
  
  return Math.max(0, precioRecomendado).toFixed(2);
};

// Añadir un efecto para calcular el precio recomendado cuando cambian los productos o el tipo
useEffect(() => {
  if (formPromocion.producto1Id) {
    const precioRecomendado = calcularPrecioRecomendado();
    dispatch({ 
      type: "SET_FORM", 
      payload: { precio: precioRecomendado } 
    });
  }
}, [formPromocion.producto1Id, formPromocion.producto2Id, formPromocion.tipo, formPromocion.descuento, formPromocion.cantidadMinima]);

  return (
    <div className="promociones-container">
      <NavBarForm />
      <h1>Gestión de Promociones y Ofertas</h1>
      
      <div className="vista-botones">
        <button 
          className={`btn-vista ${!vistaCalendario && !vistaEstadisticas ? 'active' : ''}`}
          onClick={() => { setVistaCalendario(false); setVistaEstadisticas(false); }}
        >
          Listado
        </button>
        <button 
          className={`btn-vista ${vistaCalendario ? 'active' : ''}`}
          onClick={() => { setVistaCalendario(true); setVistaEstadisticas(false); }}
        >
          <FontAwesomeIcon icon={faCalendarAlt} /> Calendario
        </button>
        <button 
          className={`btn-vista ${vistaEstadisticas ? 'active' : ''}`}
          onClick={() => { setVistaCalendario(false); setVistaEstadisticas(true); }}
        >
          <FontAwesomeIcon icon={faChartLine} /> Estadísticas
        </button>
      </div>

      {vistaCalendario ? (
        <div className="calendario-promociones">
          <h2>Calendario de Promociones</h2>
          <Calendar
            onChange={setFecha}
            value={fecha}
            tileContent={tileContent}
            onClickDay={(value) => mostrarPromocionesEnFecha(value)}
          />
          <div className="leyenda-calendario">
            <div className="leyenda-item">
              <div className="promo-dot"></div>
              <span>Promoción activa</span>
            </div>
          </div>
        </div>
      ) : vistaEstadisticas ? (
        <div className="estadisticas-promociones">
          <h2>Estadísticas de Promociones</h2>
          
          {cargandoEstadisticas ? (
            <div className="loading">Cargando estadísticas...</div>
          ) : estadisticasCompletas ? (
            <>
              {/* Resumen General */}
              <div className="resumen-promociones">
                <div className="tarjeta-estadistica">
                  <h4>Total Promociones</h4>
                  <p>{estadisticasCompletas.resumen.totalPromociones}</p>
                </div>
                <div className="tarjeta-estadistica">
                  <h4>Promociones Activas</h4>
                  <p>{estadisticasCompletas.resumen.promocionesActivas}</p>
                </div>
                <div className="tarjeta-estadistica">
                  <h4>Total Ventas con Promociones</h4>
                  <p>{estadisticasCompletas.resumen.totalVentasPromociones}</p>
                </div>
                <div className="tarjeta-estadistica">
                  <h4>Ingresos por Promociones</h4>
                  <p>${estadisticasCompletas.resumen.totalIngresosPromociones.toFixed(2)}</p>
                </div>
                <div className="tarjeta-estadistica">
                  <h4>Promedio Ventas/Promoción</h4>
                  <p>{estadisticasCompletas.resumen.promedioVentasPorPromocion}</p>
                </div>
                <div className="tarjeta-estadistica">
                  <h4>Promedio Ingresos/Promoción</h4>
                  <p>${estadisticasCompletas.resumen.promedioIngresosPorPromocion}</p>
                </div>
              </div>

              {/* Estadísticas por Tipo */}
              <div className="estadisticas-por-tipo">
                <h3>Rendimiento por Tipo de Promoción</h3>
                <div className="tabla-estadisticas">
                  <table>
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Cantidad</th>
                        <th>Ventas Totales</th>
                        <th>Ingresos Totales</th>
                        <th>Promedio por Promoción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(estadisticasCompletas.estadisticasPorTipo).map(([tipo, stats]) => (
                        <tr key={tipo}>
                          <td>{tipo}</td>
                          <td>{stats.cantidad}</td>
                          <td>{stats.ventas}</td>
                          <td>${stats.ingresos.toFixed(2)}</td>
                          <td>{stats.cantidad > 0 ? (stats.ventas / stats.cantidad).toFixed(1) : 0} ventas</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tabla Detallada por Promoción */}
              <div className="tabla-promociones-detallada">
                <h3>Detalle por Promoción</h3>
                <div className="tabla-estadisticas">
                  <table>
                    <thead>
                      <tr>
                        <th>Promoción</th>
                        <th>Tipo</th>
                        <th>Unidades Vendidas</th>
                        <th>Transacciones</th>
                        <th>Ingresos</th>
                        <th>Estado</th>
                        <th>% del Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estadisticasCompletas.promociones
                        .sort((a, b) => b.ingresosTotales - a.ingresosTotales)
                        .map(promo => (
                        <tr key={promo._id}>
                          <td>{promo.nombre}</td>
                          <td>{promo.tipo}</td>
                          <td>{promo.ventasRealizadas}</td>
                          <td>{promo.numeroTransacciones}</td>
                          <td>${promo.ingresosTotales.toFixed(2)}</td>
                          <td>
                            <span className={`estado-promo ${promo.activa ? 'activa' : 'inactiva'}`}>
                              {promo.activa ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td>
                            {estadisticasCompletas.resumen.totalIngresosPromociones > 0 
                              ? ((promo.ingresosTotales / estadisticasCompletas.resumen.totalIngresosPromociones) * 100).toFixed(1)
                              : 0}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Promociones */}
              <div className="top-promociones">
                <h3>Top 5 Promociones por Ingresos</h3>
                <div className="top-list">
                  {estadisticasCompletas.promociones
                    .sort((a, b) => b.ingresosTotales - a.ingresosTotales)
                    .slice(0, 5)
                    .map((promo, index) => (
                      <div key={promo._id} className="top-item">
                        <span className="posicion">#{index + 1}</span>
                        <span className="nombre">{promo.nombre}</span>
                        <span className="ventas">{promo.ventasRealizadas} ventas</span>
                        <span className="ingresos">${promo.ingresosTotales.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div className="no-data">No hay datos de estadísticas disponibles</div>
          )}
        </div>
      ) : (
        <>
          <form onSubmit={manejarEnvio} className="form-promocion">
            <div className="form-header">
              <h2>{editando ? "Editar Promoción" : "Nueva Promoción"}</h2>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nombre de la Promoción</label>
                <input
                  type="text"
                  name="nombre"
                  value={formPromocion.nombre}
                  onChange={manejarCambio}
                  required
                  placeholder="Ej: 2x1 en Lácteos"
                />
              </div>
              
              <div className="form-group">
                <label>Tipo de Promoción</label>
                <select
                  name="tipo"
                  value={formPromocion.tipo}
                  onChange={manejarCambio}
                  required
                >
                  {tiposPromocion.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  name="descripcion"
                  value={formPromocion.descripcion}
                  onChange={manejarCambio}
                  required
                  placeholder="Describe brevemente la promoción"
                ></textarea>
              </div>
            </div>
            {/* Campo de precio */}
<div className="form-row">
  <div className="form-group">
    <label>Precio de la promoción ($)</label>
    <input
      type="number"
      name="precio"
      value={formPromocion.precio}
      onChange={manejarCambio}
      min="0"
      step="0.01"
      required
      placeholder="Precio de venta de la promoción"
    />
    {formPromocion.tipo === "2x1" && (
      <small className="form-hint">
        Sugerencia: Para 2x1, considere usar el precio del producto principal.
      </small>
    )}
    {formPromocion.tipo === "Pack combo" && (
      <small className="form-hint">
        Sugerencia: Para pack combo, considere la suma de ambos productos menos el descuento.
      </small>
    )}
  </div>
</div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Producto Principal</label>
                <select
                  name="producto1Id"
                  value={formPromocion.producto1Id}
                  onChange={manejarCambio}
                  required
                >
                  <option value="">Seleccione un producto</option>
                  {productos.map((producto) => (
                    <option key={producto._id} value={producto._id}>
                      {producto.descripcion} - ${producto.precio} (Stock: {producto.stock})
                    </option>
                  ))}
                </select>
              </div>
              
              {mostrarSegundoProducto && (
                <div className="form-group">
                  <label>Producto Secundario</label>
                  <select
                    name="producto2Id"
                    value={formPromocion.producto2Id}
                    onChange={manejarCambio}
                    required
                  >
                    <option value="">Seleccione un producto</option>
                    {productos.map((producto) => (
                      <option key={producto._id} value={producto._id}>
                        {producto.descripcion} - ${producto.precio} (Stock: {producto.stock})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {mostrarDescuento && (
              <div className="form-row">
                <div className="form-group">
                  <label>
                    {formPromocion.tipo === "Descuento porcentaje" 
                      ? "Descuento (%)" 
                      : "Descuento ($)"}
                  </label>
                  <input
                    type="number"
                    name="descuento"
                    value={formPromocion.descuento}
                    onChange={manejarCambio}
                    min="0"
                    step={formPromocion.tipo === "Descuento porcentaje" ? "1" : "0.01"}
                    required={mostrarDescuento}
                  />
                </div>
                
                {mostrarCantidadMinima && (
                  <div className="form-group">
                    <label>Cantidad Mínima</label>
                    <input
                      type="number"
                      name="cantidadMinima"
                      value={formPromocion.cantidadMinima}
                      onChange={manejarCambio}
                      min="2"
                      step="1"
                      required={mostrarCantidadMinima}
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className="form-row">
              <div className="form-group">
                <label>Fecha de Inicio</label>
                <DatePicker
                  selected={formPromocion.fechaInicio}
                  onChange={(date) => manejarCambioFecha(date, "fechaInicio")}
                  className="date-picker"
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date()}
                />
              </div>
              
              <div className="form-group">
                <label>Fecha de Fin</label>
                <DatePicker
                  selected={formPromocion.fechaFin}
                  onChange={(date) => manejarCambioFecha(date, "fechaFin")}
                  className="date-picker"
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date(formPromocion.fechaInicio.getTime() + 86400000)} // día siguiente al inicio
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-guardar">
                {editando ? "Actualizar Promoción" : "Crear Promoción"}
              </button>
              {editando && (
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => {
                    dispatch({ type: "RESET_FORM" });
                    setEditando(null);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="lista-promociones">
            <h2>Promociones Activas</h2>
            
            <div className="input-busqueda-container">
              <input
                type="text"
                placeholder="Buscar promoción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <FontAwesomeIcon icon={faSearch} className="icono-busqueda" />
            </div>
            
            <div className="tabla-promociones">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {promocionesPaginadas.map((promocion) => (
                    <tr key={promocion._id} className={!promocion.activa ? "promocion-inactiva" : ""}>
                      <td>
                        <div className="promocion-nombre" onClick={() => mostrarInfoPromocion(promocion)}>
                          {promocion.nombre}
                        </div>
                      </td>
                      <td>{promocion.tipo}</td>
                      <td>
                        <span className={`estado-promo ${promocion.activa ? "activa" : "inactiva"}`}>
                          {promocion.activa ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td>{new Date(promocion.fechaInicio).toLocaleDateString()}</td>
                      <td>{new Date(promocion.fechaFin).toLocaleDateString()}</td>
                      <td>
                        <div className="acciones-container">
                          {promocion.activa && (
                            <>
                              <button
                                onClick={() => manejarEditar(promocion)}
                                className="btn-editar"
                                title="Editar promoción"
                              >
                                <FontAwesomeIcon icon={faPen} />
                              </button>
                              <button
                                onClick={() => manejarFinalizarPromocion(promocion._id)}
                                className="btn-finalizar"
                                title="Finalizar promoción"
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => manejarEliminar(promocion._id)}
                            className="btn-eliminar"
                            title="Eliminar promoción"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {promocionesFiltradas.length > promocionesPorPagina && (
              <div className="paginacion">
                {Array.from({ length: Math.ceil(promocionesFiltradas.length / promocionesPorPagina) }).map(
                  (_, index) => (
                    <button
                      key={index}
                      onClick={() => cambiarPagina(index + 1)}
                      className={`pagina ${paginaActual === index + 1 ? "active" : ""}`}
                    >
                      {index + 1}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Promociones;