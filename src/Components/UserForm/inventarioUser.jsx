import React, { useEffect, useState } from "react";
import { fetchProductos, fetchProductosBajoStock, createProducto, updateProducto, deleteProducto } from "./productosServices";
import NavBarUser from "../NavBarForm/NavBarUser";
import Swal from "sweetalert2"; // Importar SweetAlert2
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Para los íconos
import { faSearch, faPen, faTrash } from '@fortawesome/free-solid-svg-icons'; // Íconos específicos
import './inventario.css';

const Inventario = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [formProducto, setFormProducto] = useState({ 
    categoria: "", descripcion: "", precio: "", stock: "", imagen: "" 
  });
  const [editando, setEditando] = useState(null);

  // Cargar productos al montar el componente
  useEffect(() => {
    cargarProductos();
  }, []);

  // Verificar stock bajo cuando se cargan los productos
  useEffect(() => {
    const verificarStockBajo = async () => {
      await mostrarAlertaStockBajo();
    };

    verificarStockBajo();
  }, [productos]);

  // Función para mostrar alerta de stock bajo
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
    setFormProducto({ ...formProducto, [e.target.name]: e.target.value });
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();

    // Validación de precio y stock negativos
    if (parseFloat(formProducto.precio) < 0 || parseInt(formProducto.stock) < 0) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "El precio y el stock no pueden ser negativos.",
      });
      return;
    }

    const productoData = {
      ...formProducto,
      precio: parseFloat(formProducto.precio),
      stock: parseInt(formProducto.stock, 10),
      date: new Date().toISOString(),
    };

    try {
      if (editando) {
        await updateProducto(editando, productoData);
        
        // Mostrar alerta si el stock es bajo después de actualizar
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
          text: "El producto ha sido actualizado correctamente." 
        });
      } else {
        await createProducto(productoData);
        
        // Mostrar alerta si el nuevo producto tiene stock bajo
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
          text: "El producto ha sido creado exitosamente." 
        });
      }
      setFormProducto({ categoria: "", descripcion: "", precio: "", stock: "", imagen: "" });
      setEditando(null);
      cargarProductos();
    } catch (error) {
      console.error("Error al enviar producto:", error);
      Swal.fire({ 
        icon: "error", 
        title: "Error", 
        text: "Hubo un problema al crear o actualizar el producto. Verifica los datos." 
      });
    }
  };

  const manejarEliminar = async (id) => {
    // Mostrar un cuadro de confirmación antes de eliminar
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¡Esta acción no se puede deshacer!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
  
    // Si el usuario confirma, proceder con la eliminación
    if (result.isConfirmed) {
      try {
        await deleteProducto(id);
        Swal.fire({
          icon: "success",
          title: "Producto eliminado",
          text: "El producto ha sido eliminado correctamente."
        });
        cargarProductos();
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el producto. Intenta nuevamente."
        });
      }
    }
  };
  
  const manejarEditar = (producto) => {
    setFormProducto(producto);
    setEditando(producto._id);
  };

  const productosFiltrados = productos.filter((producto) =>
    producto.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="productos-container">
      <NavBarUser/>
      <h1>Productos</h1>
      
      {/* Barra de búsqueda */}
      <div className="input-busqueda-container">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <FontAwesomeIcon icon={faSearch} className="icono-busqueda" />
      </div>
      
      {/* Lista de productos */}
      <div className="productos-lista">
        {productosFiltrados.map((producto) => (
          <div key={producto._id} className="producto-card">
            <img src={producto.imagen} alt={producto.descripcion} className="producto-imagen" />
            <h4>{producto.descripcion}</h4>
            <p>Precio: ${producto.precio}</p>
            <p>Stock: {producto.stock}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inventario;