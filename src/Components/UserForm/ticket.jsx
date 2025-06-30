import React from "react";
import "./ticket.css"; // Importamos los estilos

const Ticket = React.forwardRef((props, ref) => (
  <div ref={ref} className="ticket-container">
    <h3 className="ticket-title">Kiosco de Agustín</h3>
    <p className="ticket-date">Fecha: {new Date().toLocaleString()}</p>
    <table className="ticket-table">
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Precio</th>
        </tr>
      </thead>
      <tbody>
        {props.items.map((item, index) => (
          <tr key={index}>
            <td>{item.name}</td>
            <td className="ticket-center">{item.quantity}</td>
            <td className="ticket-right">${item.price.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
    <hr className="ticket-divider" />
    <p className="ticket-total">
      <strong>Total: ${props.total.toFixed(2)}</strong>
    </p>
    <p className="ticket-thankyou">¡Gracias por tu compra!</p>
  </div>
));

export default Ticket;