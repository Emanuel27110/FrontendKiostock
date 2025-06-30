import React from "react";
import { FaShoppingCart, FaTrashAlt } from "react-icons/fa";
import "./carritoUser.css";

const Carrito = ({
  productosSeleccionados,
  setMostrarCarrito,
  eliminarProducto,
  modificarCantidad,
  modificarCantidadPromocion, // Nueva función para promociones
}) => {
  const total = productosSeleccionados.reduce((total, producto) => total + producto.subtotal, 0);

  const cerrarCarrito = () => {
    setMostrarCarrito(false);
  };

  return (
    <div className="carrito-modal">
      <div className="carrito-contenido">
        <h3>
          <FaShoppingCart /> Carrito de Compras
        </h3>
        {productosSeleccionados.length === 0 ? (
          <p>El carrito está vacío.</p>
        ) : (
          <ul>
            {productosSeleccionados.map((producto) => (
              <li key={producto.esPromocion ? producto.promocionId : producto.productoId} className="carrito-item">
                <span className={producto.esPromocion ? "promocion-item" : ""}>
                  {producto.descripcion}
                </span>
                <span>
                  Cantidad:{" "}
                  <input
                    type="number"
                    min="1"
                    max={producto.esPromocion ? 10 : (producto.stock + producto.cantidad)} // Para promociones limitamos a 10
                    value={producto.cantidad}
                    onChange={(e) => {
                      if (producto.esPromocion) {
                        modificarCantidadPromocion(producto.promocionId, Number(e.target.value));
                      } else {
                        modificarCantidad(producto.productoId, Number(e.target.value));
                      }
                    }}
                  />
                </span>
                <span>Subtotal: ${producto.subtotal}</span>
                <button
                  className="btn-danger"
                  onClick={() => {
                    if (producto.esPromocion) {
                      eliminarProducto(null, producto.promocionId);
                    } else {
                      eliminarProducto(producto.productoId, null);
                    }
                  }}
                >
                  <FaTrashAlt /> Eliminar
                </button>
              </li>
            ))}
            <li>
              <strong>Total: ${total}</strong>
            </li>
          </ul>
        )}
        <button onClick={cerrarCarrito} className="btn-close">
          
        </button>
      </div>
    </div>
  );
};

export default Carrito;