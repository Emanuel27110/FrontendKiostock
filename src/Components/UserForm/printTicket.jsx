import React, { useRef } from "react";
import Ticket from "./ticket";
import { useReactToPrint } from "react-to-print";
import "./printTicket.css"; // Importamos los estilos

const PrintTicket = () => {
  const ticketRef = useRef();
  const items = [
    { name: "Gaseosa", quantity: 2, price: 200 },
    { name: "Papas", quantity: 1, price: 150 },
  ];
  const total = items.reduce((sum, item) => sum + item.price, 0);

  const handlePrint = useReactToPrint({
    content: () => ticketRef.current,
  });

  return (
    <div className="print-ticket-container">
      <h1 className="print-ticket-title">Sistema de Ventas</h1>
      <Ticket ref={ticketRef} items={items} total={total} />
      <div className="print-ticket-button-container">
        <button onClick={handlePrint} className="print-ticket-button">
          Imprimir Ticket
        </button>
      </div>
    </div>
  );
};

export default PrintTicket;