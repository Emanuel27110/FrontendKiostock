import React, { useState, useEffect } from "react";
import {
  getProductos,
  getVentas,
  createVenta,
  actualizarStock,
  eliminarVenta,
} from "./ventasServices";
import { imprimirTicket } from "./ticketService"; // Importamos el servicio de tickets
import NavBarUser from "../NavBarForm/NavBarUser";
import {
  FaShoppingCart,
  FaCreditCard,
  FaCashRegister,
  FaUser,
  FaListAlt,
  FaTrashAlt,
  FaSearch,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaPrint, // Añadimos el icono de impresión
  FaTags // Agregado para promociones
} from "react-icons/fa";
import Carrito from "./carritoUser";
import "./ventasUser.css";
import Swal from 'sweetalert2';
import PrintTicket from "./printTicket";
import axios from "axios";

const VentasUser = () => {
  const [productos, setProductos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [vendedor, setVendedor] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [mensajeError, setMensajeError] = useState("");
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const ventasPorPagina = 5;
  
  // Estados para filtro de fechas
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [ventasFiltradas, setVentasFiltradas] = useState([]);

  // Estados para promociones
  const [promociones, setPromociones] = useState([]);
  const [vistaActual, setVistaActual] = useState("productos");

  // Función para obtener promociones activas
  const obtenerPromociones = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/promociones", { 
        withCredentials: true 
      });
      const promocionesActivas = response.data.filter(promo => 
        promo.activa && 
        new Date(promo.fechaInicio) <= new Date() && 
        new Date(promo.fechaFin) >= new Date()
      );
      setPromociones(promocionesActivas);
    } catch (error) {
      console.error("Error al obtener promociones:", error);
    }
  };

  // Función para agregar promoción al carrito
  const agregarPromocionAlCarrito = async (promocionId) => {
    const promocion = promociones.find((p) => p._id === promocionId);
    
    if (!promocion) {
      setMensajeError("Promoción no encontrada.");
      return;
    }

    // Obtener productos de la promoción
    const producto1 = productos.find(p => p._id === promocion.producto1Id);
    const producto2 = promocion.producto2Id ? productos.find(p => p._id === promocion.producto2Id) : null;

    if (!producto1) {
      setMensajeError("Producto principal de la promoción no encontrado.");
      return;
    }

    // Verificar stock según el tipo de promoción
    let stockSuficiente = true;
    let cantidadNecesaria = 1;

    switch (promocion.tipo) {
      case "2x1":
        stockSuficiente = producto1.stock >= 2 && (!producto2 || producto2.stock >= 1);
        break;
      case "Descuento por volumen":
        cantidadNecesaria = promocion.cantidadMinima;
        stockSuficiente = producto1.stock >= cantidadNecesaria;
        break;
      case "Pack combo":
        stockSuficiente = producto1.stock >= 1 && producto2 && producto2.stock >= 1;
        break;
      case "Descuento porcentaje":
        stockSuficiente = producto1.stock >= 1;
        break;
      default:
        stockSuficiente = false;
    }

    if (!stockSuficiente) {
      setMensajeError("Stock insuficiente para esta promoción.");
      return;
    }

    // Verificar si la promoción ya está en el carrito
    const existe = productosSeleccionados.find((p) => p.promocionId === promocionId);

    if (existe) {
      setMensajeError("Esta promoción ya está en el carrito.");
      return;
    }

    // Crear objeto de promoción para el carrito
    let descripcionPromocion = "";
    let productosPromocion = [];

    switch (promocion.tipo) {
      case "2x1":
        descripcionPromocion = `🏷️ ${promocion.nombre} (2x1: ${producto1.descripcion} + ${producto2?.descripcion || ''})`;
        productosPromocion = [
          { productoId: producto1._id, cantidad: 2 },
          ...(producto2 ? [{ productoId: producto2._id, cantidad: 1 }] : [])
        ];
        break;
      case "Descuento por volumen":
        descripcionPromocion = `🏷️ ${promocion.nombre} (${cantidadNecesaria}x ${producto1.descripcion})`;
        productosPromocion = [{ productoId: producto1._id, cantidad: cantidadNecesaria }];
        break;
      case "Pack combo":
        descripcionPromocion = `🏷️ ${promocion.nombre} (${producto1.descripcion} + ${producto2.descripcion})`;
        productosPromocion = [
          { productoId: producto1._id, cantidad: 1 },
          { productoId: producto2._id, cantidad: 1 }
        ];
        break;
      case "Descuento porcentaje":
        descripcionPromocion = `🏷️ ${promocion.nombre} (${producto1.descripcion})`;
        productosPromocion = [{ productoId: producto1._id, cantidad: 1 }];
        break;
    }

    setProductosSeleccionados((prev) => [
      ...prev,
      {
        promocionId,
        esPromocion: true,
        descripcion: descripcionPromocion,
        promocionNombre: promocion.nombre,
        precio: promocion.precio,
        cantidad: 1,
        subtotal: promocion.precio,
        productosPromocion: productosPromocion,
        tipoPromocion: promocion.tipo
      },
    ]);

    // Actualizar stock de productos
    setProductos((prev) =>
      prev.map((p) => {
        const productoEnPromo = productosPromocion.find(pp => pp.productoId === p._id);
        if (productoEnPromo) {
          return { ...p, stock: p.stock - productoEnPromo.cantidad };
        }
        return p;
      })
    );

    setMensajeError("");
    Swal.fire({
      icon: "success",
      title: "Promoción añadida al carrito",
      text: `${promocion.nombre} ha sido añadida con éxito al carrito.`,
    });
  };

  // Función para renderizar imagen de promoción
  const renderizarImagenPromocion = (promocion) => {
    const producto1 = productos.find(p => p._id === promocion.producto1Id);
    const producto2 = promocion.producto2Id ? productos.find(p => p._id === promocion.producto2Id) : null;

    if (producto2) {
      // Dos productos - mostrar ambas imágenes
      return (
        <div className="promocion-imagenes">
          <img src={producto1?.imagen || '/placeholder-product.jpg'} alt={producto1?.descripcion || 'Producto 1'} className="promocion-imagen-doble" />
          <img src={producto2?.imagen || '/placeholder-product.jpg'} alt={producto2?.descripcion || 'Producto 2'} className="promocion-imagen-doble" />
        </div>
      );
    } else {
      // Un producto - mostrar una imagen
      return (
        <img src={producto1?.imagen || '/placeholder-product.jpg'} alt={producto1?.descripcion || 'Producto'} className="promocion-imagen" />
      );
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productosObtenidos = await getProductos();
        const ventasObtenidas = await getVentas();
        setProductos(productosObtenidos);
        setProductosFiltrados(productosObtenidos); // Inicializar productos filtrados
        setVentas(ventasObtenidas);
        setVentasFiltradas(ventasObtenidas); // Inicializar las ventas filtradas
        
        // Obtener información del usuario actual
        const response = await axios.get("http://localhost:4000/api/profile", { 
          withCredentials: true 
        });
        setUsuarioActual(response.data);
        // Establecer el vendedor como el nombre del usuario actual
        setVendedor(response.data.nombre);

        // Obtener promociones
        await obtenerPromociones();
      } catch (error) {
        console.error("Error al cargar datos:", error);
        if (error.response && error.response.status === 401) {
          Swal.fire({
            icon: "error",
            title: "No autorizado",
            text: "Debes iniciar sesión para acceder a esta página",
          });
        }
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (busqueda.trim() === '') {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter(producto => 
        producto.descripcion.toLowerCase().includes(busqueda.toLowerCase())
      );
      setProductosFiltrados(filtrados);
    }
  }, [busqueda, productos]);

  // Efecto para filtrar ventas por fecha
  useEffect(() => {
    let ventasFiltradas = ventas;
    
    if (fechaInicio) {
      const fechaInicioObj = new Date(fechaInicio);
      fechaInicioObj.setHours(0, 0, 0, 0);
      ventasFiltradas = ventasFiltradas.filter(venta => {
        const fechaVenta = new Date(venta.createdAt);
        return fechaVenta >= fechaInicioObj;
      });
    }
    
    if (fechaFin) {
      const fechaFinObj = new Date(fechaFin);
      fechaFinObj.setHours(23, 59, 59, 999);
      ventasFiltradas = ventasFiltradas.filter(venta => {
        const fechaVenta = new Date(venta.createdAt);
        return fechaVenta <= fechaFinObj;
      });
    }
    
    setVentasFiltradas(ventasFiltradas);
    setPaginaActual(1); // Resetear a la primera página cuando se aplican filtros
  }, [fechaInicio, fechaFin, ventas]);

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };
  
  const limpiarBusqueda = () => {
    setBusqueda("");
  };

  const limpiarFiltroFechas = () => {
    setFechaInicio("");
    setFechaFin("");
  };

  const modificarCantidadPromocion = (promocionId, nuevaCantidad) => {
  const promocionSeleccionada = productosSeleccionados.find(
    (p) => p.promocionId === promocionId && p.esPromocion
  );

  if (!promocionSeleccionada) return;

  // Verificar si hay suficiente stock para la nueva cantidad
  let stockSuficiente = true;
  const diferenciaCantidad = nuevaCantidad - promocionSeleccionada.cantidad;

  // Verificar stock según el tipo de promoción
  promocionSeleccionada.productosPromocion.forEach(productoPromo => {
    const producto = productos.find(p => p._id === productoPromo.productoId);
    if (producto) {
      const stockNecesario = productoPromo.cantidad * diferenciaCantidad;
      if (producto.stock < stockNecesario) {
        stockSuficiente = false;
      }
    }
  });

  if (!stockSuficiente) {
    Swal.fire({
      icon: "error",
      title: "Stock insuficiente",
      text: "No hay suficiente stock para aumentar la cantidad de esta promoción.",
    });
    return;
  }

  // Actualizar la cantidad de la promoción
  setProductosSeleccionados((prev) =>
    prev.map((p) =>
      p.promocionId === promocionId && p.esPromocion
        ? { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio }
        : p
    )
  );

  // Actualizar el stock de los productos
  setProductos((prev) =>
    prev.map((p) => {
      const productoEnPromo = promocionSeleccionada.productosPromocion.find(pp => pp.productoId === p._id);
      if (productoEnPromo) {
        const stockNecesario = productoEnPromo.cantidad * diferenciaCantidad;
        return { ...p, stock: p.stock - stockNecesario };
      }
      return p;
    })
  );
};
  // Función para generar e imprimir el ticket para una venta específica
  const handleImprimirTicket = async (venta) => {
    if (!venta) {
      Swal.fire({
        icon: "error",
        title: "No hay venta para imprimir",
        text: "Realice primero una venta para generar un ticket.",
      });
      return;
    }
    
    try {
      const result = await imprimirTicket(venta);
      if (result) {
        Swal.fire({
          icon: "success",
          title: "Ticket generado correctamente",
          text: "El ticket se ha generado y descargado correctamente.",
        });
      } else {
        throw new Error("Error al generar el ticket");
      }
    } catch (error) {
      console.error("Error al imprimir el ticket:", error);
      Swal.fire({
        icon: "error",
        title: "Error al generar el ticket",
        text: "Hubo un problema al generar el ticket de venta.",
      });
    }
  };

  // Agregar producto al carrito
  const agregarProductoAlCarrito = (productoId) => {
    const producto = productos.find((p) => p._id === productoId);
  
    if (!producto || producto.stock <= 0) {
      setMensajeError("Producto sin stock.");
      return;
    }
  
    const existe = productosSeleccionados.find((p) => p.productoId === productoId);
  
    if (existe) {
      if (existe.cantidad < producto.stock) {
        const nuevoStock = producto.stock - 1;
        modificarCantidadProducto(productoId, existe.cantidad + 1);
        
        if (nuevoStock > 0 && nuevoStock <= 10) {
          Swal.fire({
            icon: 'warning',
            title: 'Stock Bajo',
            html: `<div>
                    <p>¡Atención! El producto <strong>${producto.descripcion}</strong> 
                    tiene un stock bajo:</p>
                    <p style="font-size: 1.2em; color: #dc3545;">
                      ${nuevoStock} unidades
                    </p>
                  </div>`,
            confirmButtonColor: '#007bff'
          });
        }
      } else {
        setMensajeError("No hay suficiente stock disponible.");
      }
    } else {
      const nuevoStock = producto.stock - 1;
      setProductosSeleccionados((prev) => [
        ...prev,
        {
          productoId,
          descripcion: producto.descripcion,
          precio: producto.precio,
          cantidad: 1,
          subtotal: producto.precio,
          stock: nuevoStock,
        },
      ]);
  
      setProductos((prev) =>
        prev.map((p) =>
          p._id === productoId ? { ...p, stock: nuevoStock } : p
        )
      );

      if (nuevoStock > 0 && nuevoStock <= 10) {
        Swal.fire({
          icon: 'warning',
          title: 'Stock Bajo',
          html: `<div>
                  <p>¡Atención! El producto <strong>${producto.descripcion}</strong> 
                  tiene un stock bajo:</p>
                  <p style="font-size: 1.2em; color: #dc3545;">
                    ${nuevoStock} unidades
                  </p>
                </div>`,
          confirmButtonColor: '#007bff'
        });
      }
    }
  
    setMensajeError("");
    Swal.fire({
      icon: "success",
      title: "Producto añadido al carrito",
      text: `${producto.descripcion} ha sido añadido con éxito al carrito.`,
    });
  };

  // Función para eliminar un producto del carrito (modificada para manejar promociones)
  const eliminarProductoDelCarrito = (productoId, promocionId = null) => {
    if (promocionId) {
      // Eliminar promoción del carrito
      const promocionEliminada = productosSeleccionados.find((p) => p.promocionId === promocionId);
      
      if (promocionEliminada) {
        // Restaurar stock de todos los productos de la promoción
        setProductos((prev) =>
          prev.map((p) => {
            const productoEnPromo = promocionEliminada.productosPromocion?.find(pp => pp.productoId === p._id);
            if (productoEnPromo) {
              return { ...p, stock: p.stock + productoEnPromo.cantidad };
            }
            return p;
          })
        );

        setProductosSeleccionados((prev) => prev.filter((p) => p.promocionId !== promocionId));
      }
    } else {
      // Eliminar producto normal del carrito
      const productoEliminado = productosSeleccionados.find((p) => p.productoId === productoId && !p.esPromocion);

      if (productoEliminado) {
        setProductos((prev) =>
          prev.map((p) =>
            p._id === productoId ? { ...p, stock: p.stock + productoEliminado.cantidad } : p
          )
        );

        setProductosSeleccionados((prev) => prev.filter((p) => !(p.productoId === productoId && !p.esPromocion)));
      }
    }
  };

  // Función para modificar la cantidad de un producto
  const modificarCantidadProducto = (productoId, nuevaCantidad) => {
    const productoSeleccionado = productosSeleccionados.find(
      (p) => p.productoId === productoId
    );
  
    if (!productoSeleccionado) return;
  
    const diferencia = nuevaCantidad - productoSeleccionado.cantidad;
  
    if (productoSeleccionado.stock - diferencia < 0) {
      Swal.fire({
        icon: "error",
        title: "Stock insuficiente",
        text: `No puedes seleccionar más de ${productoSeleccionado.stock + productoSeleccionado.cantidad} unidades.`,
      });
      return;
    }
  
    setProductosSeleccionados((prev) =>
      prev.map((p) =>
        p.productoId === productoId
          ? { ...p, cantidad: nuevaCantidad, subtotal: nuevaCantidad * p.precio }
          : p
      )
    );
  
    // Ajustar el stock en la lista de productos
    setProductos((prev) =>
      prev.map((p) =>
        p._id === productoId ? { ...p, stock: p.stock - diferencia } : p
      )
    );
  };

  // Realizar la venta (modificada para manejar promociones)
  const realizarVenta = async () => {
    if (!vendedor.trim()) {
      Swal.fire({ icon: "error", title: "Falta el vendedor", text: "Proporcione el nombre del vendedor." });
      return;
    }
    if (!productosSeleccionados.length) {
      Swal.fire({ icon: "error", title: "Carrito vacío", text: "Seleccione al menos un producto." });
      return;
    }
    try {
      const totalVenta = productosSeleccionados.reduce((acc, p) => acc + p.subtotal, 0);
      
      // Separar productos normales y promociones
      const productosNormales = productosSeleccionados.filter(p => !p.esPromocion);
      const promocionesSeleccionadas = productosSeleccionados.filter(p => p.esPromocion);

      // Preparar datos de venta con formato correcto
      const ventaData = {
        productos: productosNormales.map(p => ({
          productoId: p.productoId,
          descripcion: p.descripcion,
          precio: p.precio,
          cantidad: p.cantidad,
          subtotal: p.subtotal
        })),
        vendedor,
        metodoPago,
        total: totalVenta,
        promociones: promocionesSeleccionadas.map(p => ({
          promocionId: p.promocionId,
          nombre: p.promocionNombre || p.descripcion,
          precio: p.precio,
          cantidad: p.cantidad || 1,
          subtotal: p.subtotal,
          tipoPromocion: p.tipoPromocion,
          productosPromocion: p.productosPromocion || []
        }))
      };

      const response = await createVenta(ventaData);

      // Guardamos referencia a la venta actual
      const ventaActual = response.venta;

      if (response.productosBajoStock && response.productosBajoStock.length > 0) {
        const mensaje = response.productosBajoStock.map(
          producto => `• ${producto.descripcion}: ${producto.stock} unidades`
        ).join('\n');

        await Swal.fire({
          icon: 'warning',
          title: 'Productos con Stock Bajo',
          html: `<div style="text-align: left; margin-top: 10px;">
                 <p>Los siguientes productos quedaron con stock bajo:</p>
                 <pre style="margin-top: 10px;">${mensaje}</pre>
               </div>`,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#007bff'
        });
      }

      if (metodoPago === "mercadopago" && ventaActual.qrLink) {
        window.open(ventaActual.qrLink, "_blank");
      }      
      
      // Modificamos el SweetAlert para incluir el botón de imprimir ticket
      Swal.fire({ 
        icon: "success", 
        title: "Venta realizada con éxito", 
        text: `Total: $${totalVenta.toFixed(2)}`,
        showDenyButton: true,
        confirmButtonText: "OK",
        denyButtonText: `<i class="fa fa-print"></i> Imprimir Ticket`,
        denyButtonColor: '#28a745'
      }).then((result) => {
        if (result.isDenied) {
          // Importante: pasamos directamente la venta actual aquí
          handleImprimirTicket(ventaActual);
        }
      });
      
      // Actualiza el estado directamente con la nueva venta
      const nuevaVenta = ventaActual;
      setVentas(prevVentas => [nuevaVenta, ...prevVentas]);
      setVentasFiltradas(prevVentas => {
        // Verifica si la nueva venta cumple con los filtros de fecha
        let incluir = true;
        
        if (fechaInicio) {
          const fechaInicioObj = new Date(fechaInicio);
          fechaInicioObj.setHours(0, 0, 0, 0);
          const fechaVenta = new Date(nuevaVenta.createdAt);
          incluir = incluir && fechaVenta >= fechaInicioObj;
        }
        
        if (fechaFin) {
          const fechaFinObj = new Date(fechaFin);
          fechaFinObj.setHours(23, 59, 59, 999);
          const fechaVenta = new Date(nuevaVenta.createdAt);
          incluir = incluir && fechaVenta <= fechaFinObj;
        }
        
        return incluir ? [nuevaVenta, ...prevVentas] : prevVentas;
      });
      
      setProductosSeleccionados([]); // Vaciar carrito
      // No reseteamos el vendedor ya que ahora se carga automáticamente
      setMetodoPago('efectivo');
      
      // Recargar promociones para actualizar stock
      await obtenerPromociones();
    } catch (error) {
      console.error("Error al realizar la venta:", error);
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo realizar la venta." });
    }
  };
  
  // Eliminar una venta
  const eliminarUnaVenta = async (ventaId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¡Esta acción no se puede deshacer!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
  
    if (result.isConfirmed) {
      try {
        await eliminarVenta(ventaId);
        const ventasActualizadas = ventas.filter((v) => v._id !== ventaId);
        setVentas(ventasActualizadas);
        setVentasFiltradas(ventasActualizadas.filter(venta => {
          let incluir = true;
          
          if (fechaInicio) {
            const fechaInicioObj = new Date(fechaInicio);
            fechaInicioObj.setHours(0, 0, 0, 0);
            const fechaVenta = new Date(venta.createdAt);
            incluir = incluir && fechaVenta >= fechaInicioObj;
          }
          
          if (fechaFin) {
            const fechaFinObj = new Date(fechaFin);
            fechaFinObj.setHours(23, 59, 59, 999);
            const fechaVenta = new Date(venta.createdAt);
            incluir = incluir && fechaVenta <= fechaFinObj;
          }
          
          return incluir;
        }));
        
        Swal.fire({
          icon: "success",
          title: "Venta eliminada",
          text: "La venta ha sido eliminada correctamente.",
        });
      } catch (error) {
        console.error("Error al eliminar la venta:", error);
        Swal.fire({
          icon: "error",
          title: "Error al eliminar la venta",
          text: "Hubo un error al eliminar la venta. Intenta nuevamente.",
        });
      }
    }
  };

  // Lógica para la paginación
  const indiceUltimaVenta = paginaActual * ventasPorPagina;
  const indicePrimeraVenta = indiceUltimaVenta - ventasPorPagina;
  const ventasActuales = ventasFiltradas
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(indicePrimeraVenta, indiceUltimaVenta);
  
  const totalPaginas = Math.ceil(ventasFiltradas.length / ventasPorPagina);
  
  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };
  
  return (
    <div className="ventas-container">
      <NavBarUser />
      <h3 className="section-title">
        <FaListAlt /> Crear Venta
      </h3>
      <div className="form-group">
        <label>
          <FaUser /> Vendedor:
        </label>
        <input
          type="text"
          value={vendedor}
          readOnly
          className="input-readonly"
        />
      </div>

      <div className="form-group">
        <label>
          <FaCreditCard /> Método de pago:
        </label>
        <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
          <option value="mercadopago">Mercado Pago</option>
        </select>
      </div>

      {/* Botones de vista */}
      <div className="vista-botones">
        <button 
          className={`btn-vista ${vistaActual === "productos" ? "active" : ""}`}
          onClick={() => setVistaActual("productos")}
        >
          Productos
        </button>
        <button 
          className={`btn-vista ${vistaActual === "promociones" ? "active" : ""}`}
          onClick={() => setVistaActual("promociones")}
        >
          <FaTags /> Promociones
        </button>
      </div>

      {vistaActual === "productos" ? (
        <>
          <h4 className="section-title">Productos disponibles</h4>
          {/* Barra de búsqueda */}
          <div className="buscador-container">
            <div className="input-search-container">
              <input 
                type="text" 
                placeholder="Buscar productos..." 
                value={busqueda}
                onChange={handleBusquedaChange}
                className="buscador-input"
              />
              <FaSearch className="search-icon" />
            </div>
            {busqueda && (
              <button className="btn-limpiar" onClick={limpiarBusqueda}>
                Limpiar
              </button>
            )}
          </div>

          <div className="productos-list">
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map((producto) => (
                <div key={producto._id} className="producto-card">
                  <img src={producto.imagen} alt={producto.descripcion} className="producto-imagen" />
                  <h5>{producto.descripcion}</h5>
                  <p>Precio: ${producto.precio}</p>
                  <p>Stock disponible: {producto.stock}</p>
                  <button
                    className="btn-secondary"
                    onClick={() => agregarProductoAlCarrito(producto._id)}
                    disabled={producto.stock <= 0}
                  >
                    <FaShoppingCart /> Añadir al carrito
                  </button>
                </div>
              ))
            ) : (
              <div className="no-resultados">No se encontraron productos que coincidan con la búsqueda.</div>
            )}
          </div>
        </>
      ) : (
        <>
<h4 className="section-title">
            <FaTags /> Promociones Activas
          </h4>
          
          <div className="promociones-list">
            {promociones.length > 0 ? (
              promociones.map((promocion) => (
                <div key={promocion._id} className="promocion-card">
                  {renderizarImagenPromocion(promocion)}
                  <div className="promocion-info">
                    <h5>{promocion.nombre}</h5>
                    <p className="promocion-tipo">{promocion.tipo}</p>
                    <p className="promocion-descripcion">{promocion.descripcion}</p>
                    <p className="promocion-precio">Precio: ${promocion.precio}</p>
                    <p className="promocion-fechas">
                      Válida hasta: {new Date(promocion.fechaFin).toLocaleDateString('es-AR')}
                    </p>
                    <button
                      className="btn-secondary"
                      onClick={() => agregarPromocionAlCarrito(promocion._id)}
                    >
                      <FaTags /> Añadir Promoción
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-resultados">No hay promociones activas disponibles.</div>
            )}
          </div>
        </>
      )}

      <button className="btn-primary" onClick={() => setMostrarCarrito(true)}>
        <FaShoppingCart /> Ver Carrito
      </button>

      {mostrarCarrito && (
  <Carrito
    productosSeleccionados={productosSeleccionados}
    setMostrarCarrito={setMostrarCarrito}
    eliminarProducto={eliminarProductoDelCarrito}
    modificarCantidad={modificarCantidadProducto}
    modificarCantidadPromocion={modificarCantidadPromocion}
  />
)}

      <button className="btn-primary" onClick={realizarVenta}>
        <FaCashRegister /> Realizar Venta
      </button>

      {mensajeError && <p className="error-message">{mensajeError}</p>}

      <h3 className="section-title">Últimas Ventas</h3>
      
      {/* Filtro de fechas */}
      <div className="filtro-fechas">
        <div className="fechas-container">
          <div className="fecha-grupo">
            <label><FaCalendarAlt /> Desde:</label>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)}
              className="fecha-input"
            />
          </div>
          <div className="fecha-grupo">
            <label><FaCalendarAlt /> Hasta:</label>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)}
              className="fecha-input"
            />
          </div>
          {(fechaInicio || fechaFin) && (
            <button className="btn-limpiar" onClick={limpiarFiltroFechas}>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
      
      <div className="ventas-table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Vendedor</th>
              <th>Productos</th>
              <th>Promociones</th>
              <th>Método de pago</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {ventasActuales.length > 0 ? (
              ventasActuales.map((venta) => (
                <tr key={venta._id}>
                  <td>
                    {new Date(venta.createdAt).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td>{venta.vendedor}</td>
                  <td>
                    {venta.productos && venta.productos.length > 0 ? (
                      venta.productos.map((p, i) => (
                        <div key={i}>
                          {p.descripcion} - Cantidad: {p.cantidad} - Subtotal: ${p.subtotal}
                        </div>
                      ))
                    ) : (
                      <span>Sin productos</span>
                    )}
                  </td>
                  <td>
                    {venta.promociones && venta.promociones.length > 0 ? (
                      venta.promociones.map((promo, i) => (
                        <div key={i} className="promocion-venta">
                          🏷️ {promo.nombre} - ${promo.subtotal}
                        </div>
                      ))
                    ) : (
                      <span>Sin promociones</span>
                    )}
                  </td>
                  <td>{venta.metodoPago}</td>
                  <td>${venta.total}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-ventas">No se encontraron ventas en el período seleccionado.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Paginación */}
        {ventasFiltradas.length > 0 && (
          <div className="paginacion">
            <button 
              onClick={() => cambiarPagina(paginaActual - 1)} 
              disabled={paginaActual === 1}
              className="btn-pagina"
            >
              <FaChevronLeft />
            </button>
            <span className="pagina-info">
              Página {paginaActual} de {totalPaginas}
            </span>
            <button 
              onClick={() => cambiarPagina(paginaActual + 1)} 
              disabled={paginaActual === totalPaginas}
              className="btn-pagina"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VentasUser;