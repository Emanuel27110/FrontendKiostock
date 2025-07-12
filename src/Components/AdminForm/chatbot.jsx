import React, { useState } from "react";
import "./Chatbot.css";
import { consultarStock } from "./productosService"; // Importar la función del servicio

const Chatbot = ({ productos }) => {
  const [mensaje, setMensaje] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [showChatbot, setShowChatbot] = useState(false);
  const [cargando, setCargando] = useState(false); // Estado para mostrar loading

  const manejarConsulta = async () => {
    if (!mensaje.trim()) {
      setRespuesta("Por favor, ingresa el nombre del producto a consultar.");
      return;
    }

    setCargando(true);
    console.log("🔍 Consultando stock para:", mensaje.trim());
    
    try {
      // Usar la función del servicio que ya tiene la configuración correcta
      const data = await consultarStock(mensaje.trim());
      
      console.log("✅ Respuesta del servidor:", data);
      
      const { descripcion, stock } = data;
      setRespuesta(`El producto "${descripcion}" tiene un stock de ${stock} unidades.`);
    } catch (error) {
      console.error("❌ Error al consultar stock:", error);
      console.error("❌ Status:", error.response?.status);
      console.error("❌ Data:", error.response?.data);
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 401) {
        setRespuesta("Error de autenticación. Por favor, inicia sesión nuevamente.");
      } else if (error.response?.status === 404) {
        setRespuesta("No se encontró el producto en el inventario.");
      } else {
        setRespuesta(`Error al consultar el stock: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setCargando(false);
    }
    
    setMensaje(""); // Limpiar el mensaje después de la consulta
  };

  const handleOpenChatbot = () => {
    setShowChatbot(true);
  };

  const handleCloseChatbot = () => {
    setShowChatbot(false);
    setRespuesta(""); // Limpiar respuesta al cerrar
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !cargando) {
      manejarConsulta();
    }
  };

  return (
    <div className="chatbot-container">
      {/* Botón para abrir el chatbot */}
      {!showChatbot && (
        <button className="open-chatbot-btn" onClick={handleOpenChatbot}>
          💬 Consultar Stock
        </button>
      )}

      {/* Chatbot visible cuando showChatbot es true */}
      {showChatbot && (
        <div className="chatbot">
          <div className="chatbot-header">
            Consultas de Stock
            <button className="close-chatbot-btn" onClick={handleCloseChatbot}>
              ✕
            </button>
          </div>
          <div className="chatbot-body">
            <input
              type="text"
              placeholder="Consultar stock (ej: 'Coca Cola')"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={cargando}
            />
            <button 
              onClick={manejarConsulta} 
              className="btn-consultar"
              disabled={cargando}
            >
              {cargando ? "Consultando..." : "Consultar"}
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