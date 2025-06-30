import React, { useEffect, useState, useReducer, useRef } from "react";
import {
  fetchProductos,
  fetchProductosBajoStock,
  createProducto,
  updateProducto,
  deleteProducto,
} from "./productosService";
import NavBarForm from "../NavBarForm/NavBarForm";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPen,
  faTrash,
  faFileExcel,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import "./Productos.css";
import { exportarExcel, exportarPDF } from "./exportar";
import Chatbot from './chatbot';

const formularioReducer = (state, action) => {
  switch (action.type) {
    case "SET_FORM":
      return { ...state, ...action.payload };
    case "RESET_FORM":
      return {
        categoria: "",
        descripcion: "",
        precio: "",
        stock: "",
        imagen: "",
      };
    default:
      return state;
  }
};

const categorias = ["Lácteos", "Snacks", "Bebidas", "Dulces", "Papelería", "Mercaderia", "Limpieza", "Galletas"];

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState(["Todos"]);
  const [formProducto, dispatch] = useReducer(formularioReducer, {
    categoria: "",
    descripcion: "",
    precio: "",
    stock: "",
    imagen: "",
  });
  const [editando, setEditando] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [productosPorPagina] = useState(10);
  const [showChatbot, setShowChatbot] = useState(true);
  const tablaRef = useRef(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    const verificarStockBajo = async () => {
      await mostrarAlertaStockBajo();
    };

    verificarStockBajo();
  }, [productos]);

  const mostrarAlertaStockBajo = async () => {
    try {
      const productosBajoStock = await fetchProductosBajoStock();
      
      if (productosBajoStock.length > 0) {
        const mensaje = productosBajoStock.map(
          producto => `• ${producto.descripcion}: ${producto.stock} unidades`
        ).join('\n');

        await Swal.fire({
          icon: 'warning',
          title: 'Productos con Stock Bajo',
          html: `<div style="text-align: left; margin-top: 10px;">
                   <p>Los siguientes productos tienen stock bajo:</p>
                   <pre style="margin-top: 10px;">${mensaje}</pre>
                 </div>`,
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#007bff'
        });
      }
    } catch (error) {
      console.error('Error al verificar stock bajo:', error);
    }
  };

  const cargarProductos = async () => {
    const productosData = await fetchProductos();
    setProductos(productosData);
  };

  const manejarCambio = (e) => {
    dispatch({ type: "SET_FORM", payload: { [e.target.name]: e.target.value } });
  };

  // Función para verificar si ya existe un producto con la misma descripción
  const existeProductoDuplicado = (descripcion) => {
    // Normalizar descripciones para comparar (trim y lowercase)
    const descNormalizada = descripcion.trim().toLowerCase();
    
    return productos.some(producto => {
      // Si estamos editando, ignorar el producto actual en la comparación
      if (editando && producto._id === editando) {
        return false;
      }
      return producto.descripcion.trim().toLowerCase() === descNormalizada;
    });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    
    if (parseFloat(formProducto.precio) < 0 || parseInt(formProducto.stock) < 0) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "El precio y el stock no pueden ser negativos.",
      });
      return;
    }

    // Verificar si ya existe un producto con la misma descripción
    if (existeProductoDuplicado(formProducto.descripcion)) {
      Swal.fire({
        icon: "error",
        title: "Producto duplicado",
        text: "Ya existe un producto con esta descripción. Por favor, use una descripción única.",
      });
      return;
    }

    try {
      const productoData = {
        ...formProducto,
        precio: parseFloat(formProducto.precio),
        stock: parseInt(formProducto.stock, 10),
        date: new Date().toISOString(),
      };

      if (editando) {
        await updateProducto(editando, productoData);
        
        if (productoData.stock > 0 && productoData.stock <= 10) {
          await Swal.fire({
            icon: 'warning',
            title: 'Stock Bajo',
            html: `<div>
                    <p>¡Atención! El producto <strong>${productoData.descripcion}</strong> 
                    tiene un stock bajo:</p>
                    <p style="font-size: 1.2em; color: #dc3545;">
                      ${productoData.stock} unidades
                    </p>
                  </div>`,
            confirmButtonColor: '#007bff'
          });
        }

        Swal.fire({
          icon: "success",
          title: "Producto actualizado",
          text: "El producto ha sido actualizado correctamente.",
        });
      } else {
        await createProducto(productoData);
        
        if (productoData.stock > 0 && productoData.stock <= 10) {
          await Swal.fire({
            icon: 'warning',
            title: 'Stock Bajo',
            html: `<div>
                    <p>¡Atención! El nuevo producto <strong>${productoData.descripcion}</strong> 
                    tiene un stock bajo:</p>
                    <p style="font-size: 1.2em; color: #dc3545;">
                      ${productoData.stock} unidades
                    </p>
                  </div>`,
            confirmButtonColor: '#007bff'
          });
        }

        Swal.fire({
          icon: "success",
          title: "Producto creado",
          text: "El producto ha sido creado exitosamente.",
        });
      }

      dispatch({ type: "RESET_FORM" });
      setEditando(null);
      await cargarProductos();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Hubo un problema al crear o actualizar el producto.",
      });
    }
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
        await deleteProducto(id);
        Swal.fire({
          icon: "success",
          title: "Producto eliminado",
          text: "El producto ha sido eliminado correctamente.",
        });
        cargarProductos();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el producto. Intenta nuevamente.",
        });
      }
    }
  };

  const manejarEditar = (producto) => {
    dispatch({ type: "SET_FORM", payload: producto });
    setEditando(producto._id);
  };

  const productosFiltrados = productos.filter((producto) => {
    if (categoriasSeleccionadas.includes("Todos")) {
      return producto.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    }
    
    return (
      categoriasSeleccionadas.includes(producto.categoria) &&
      producto.descripcion.toLowerCase().includes(busqueda.toLowerCase())
    );
  });

  const toggleCategoria = (categoria) => {
    if (categoria === "Todos") {
      setCategoriasSeleccionadas(["Todos"]);
    } else {
      setCategoriasSeleccionadas(prev => {
        const newSelection = prev.includes("Todos") ? [] : prev.filter(cat => cat !== "Todos");
        
        if (newSelection.includes(categoria)) {
          const result = newSelection.filter(cat => cat !== categoria);
          return result.length === 0 ? ["Todos"] : result;
        } else {
          return [...newSelection, categoria];
        }
      });
    }
  };

  const indexUltimoProducto = paginaActual * productosPorPagina;
  const indexPrimerProducto = indexUltimoProducto - productosPorPagina;
  const productosPaginados = productosFiltrados.slice(
    indexPrimerProducto,
    indexUltimoProducto
  );

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const toggleChatbot = () => {
    setShowChatbot((prev) => !prev);
  };

  return (
    <div className="productos-container">
      <NavBarForm />
      <h1>Productos</h1>

      <div className="botones-exportar">
        <button onClick={() => exportarExcel(productos)} className="btn-exportar">
          <FontAwesomeIcon icon={faFileExcel} /> Exportar a Excel
        </button>
        <button onClick={() => exportarPDF(productos)} className="btn-exportar">
          <FontAwesomeIcon icon={faFilePdf} /> Exportar a PDF
        </button>
      </div>

      <form onSubmit={manejarEnvio}>
        <div className="form-group">
          <label>Categoría</label>
          <select
            name="categoria"
            value={formProducto.categoria}
            onChange={manejarCambio}
            required
          >
            <option value="">Seleccione una categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Descripción</label>
          <input
            type="text"
            name="descripcion"
            value={formProducto.descripcion}
            onChange={manejarCambio}
            required
          />
        </div>
        <div className="form-group">
          <label>Precio</label>
          <input
            type="number"
            name="precio"
            value={formProducto.precio}
            onChange={manejarCambio}
            min="0"
            step="0.01"
            required
          />
        </div>
        <div className="form-group">
          <label>Stock</label>
          <input
            type="number"
            name="stock"
            value={formProducto.stock}
            onChange={manejarCambio}
            min="0"
            step="1"
            required
          />
        </div>
        <div className="form-group">
          <label>Imagen</label>
          <input
            type="text"
            name="imagen"
            value={formProducto.imagen}
            onChange={manejarCambio}
          />
        </div>
        <button type="submit" className="btn-enviar">
          {editando ? "Actualizar Producto" : "Crear Producto"}
        </button>
      </form>

      <h2>Lista de Productos</h2>

      <div className="input-busqueda-container">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <FontAwesomeIcon icon={faSearch} className="icono-busqueda" />
      </div>

      <div className="input-filtro-categoria">
        <label>Filtrar por Categorías:</label>
        <div className="chips-container">
          {["Todos", ...categorias].map((categoria) => (
            <div
              key={categoria}
              className={`chip ${categoriasSeleccionadas.includes(categoria) ? "selected" : ""}`}
              onClick={() => toggleCategoria(categoria)}
            >
              {categoria}
            </div>
          ))}
        </div>
      </div>

      <div ref={tablaRef} className="tabla-productos">
        <table>
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosPaginados.map((producto) => (
              <tr key={producto._id}>
                <td>
                  <img src={producto.imagen} alt={producto.descripcion} />
                </td>
                <td>{producto.descripcion}</td>
                <td>
                  <span className="precio-valor">${producto.precio}</span>
                </td>
                <td className={
                  producto.stock <= 5 ? "stock-bajo" : 
                  producto.stock <= 10 ? "stock-medio" : ""
                }>
                  {producto.stock}
                </td>
                <td>
                  <div className="acciones-container">
                    <button
                      onClick={() => manejarEditar(producto)}
                      className="btn-editar"
                    >
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button
                      onClick={() => manejarEliminar(producto._id)}
                      className="btn-eliminar"
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

      <div className="paginacion">
        {Array.from({ length: Math.ceil(productosFiltrados.length / productosPorPagina) }).map((_, index) => (
          <button
            key={index}
            onClick={() => cambiarPagina(index + 1)}
            className={`pagina ${paginaActual === index + 1 ? "active" : ""}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {showChatbot && <Chatbot />}
      
    </div>
  );
};

export default Productos;