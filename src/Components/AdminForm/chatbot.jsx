import React, { useState } from "react"; 
import "./Chatbot.css";
import axios from 'axios'; // Importamos axios para hacer la consulta al backend

const Chatbot = ({ productos }) => {
  const [mensaje, setMensaje] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [showChatbot, setShowChatbot] = useState(false); // Estado para controlar la visibilidad del chatbot

  const manejarConsulta = async () => {
    try {
      // Llamada al backend para consultar el stock del producto
      const response = await axios.get(`http://localhost:4000/api/productos/consultar-stock/${mensaje}`, { withCredentials: true });
      
      const { descripcion, stock } = response.data;
      setRespuesta(`El producto "${descripcion}" tiene un stock de ${stock} unidades.`);
    } catch (error) {
      setRespuesta("No se encontró el producto en el inventario.");
    }

    setMensaje(""); // Limpiar el mensaje después de la consulta
  };

  const handleOpenChatbot = () => {
    setShowChatbot(true); // Mostrar el chatbot
  };

  const handleCloseChatbot = () => {
    setShowChatbot(false); // Ocultar el chatbot
  };

  return (
    <div className="chatbot-container">
      {/* Botón para abrir el chatbot */}
      {!showChatbot && (
        <button className="open-chatbot-btn" onClick={handleOpenChatbot}>
          Abrir Chatbot
        </button>
      )}

      {/* Chatbot visible cuando showChatbot es true */}
      {showChatbot && (
        <div className="chatbot">
          <div className="chatbot-header">
            Consultas de Stock
            <button className="close-chatbot-btn" onClick={handleCloseChatbot}>
              X
            </button>
          </div>
          <div className="chatbot-body">
            <input
              type="text"
              placeholder="Consultar stock (ej: 'Chocolate')"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && manejarConsulta()}
            />
            <button onClick={manejarConsulta} className="btn-consultar">
              Consultar
            </button>
          </div>
          <div className="chatbot-respuesta">
            <p>{respuesta}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
