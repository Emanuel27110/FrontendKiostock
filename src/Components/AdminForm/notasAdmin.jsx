import NavBarForm from "../NavBarForm/NavBarForm";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import './notasAdmin.css';

function NotasAdmin() {
  const [notas, setNotas] = useState([]);
  const [nuevasNotas, setNuevasNotas] = useState(0); // Cambié esto para ser un número

  useEffect(() => {
    const fetchNotas = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/notas");
        setNotas(response.data);
        
        // Contar las notas no leídas
        const cantidadNotasNoLeidas = response.data.filter(nota => !nota.leida).length;
        setNuevasNotas(cantidadNotasNoLeidas);
      } catch (error) {
        Swal.fire("Error", "Error al obtener las notas.", "error");
        console.error("Error al obtener las notas:", error);
      }
    };

    fetchNotas();
    
    // Configurar un intervalo para verificar nuevas notas periódicamente
    const intervalo = setInterval(fetchNotas, 60000); // Verificar cada minuto
    
    // Limpiar intervalo al desmontar el componente
    return () => clearInterval(intervalo);
  }, []);

  // Marcar como leída
  const marcarComoLeida = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¿Quieres marcar esta nota como leída?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, marcar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.put(`http://localhost:4000/api/notas/${id}/leida`);
        const notasActualizadas = notas.map(nota => nota._id === id ? { ...nota, leida: true } : nota);
        setNotas(notasActualizadas);
        
        // Recalcular las notas no leídas
        const cantidadNotasNoLeidas = notasActualizadas.filter(nota => !nota.leida).length;
        setNuevasNotas(cantidadNotasNoLeidas);
        
        Swal.fire("¡Hecho!", "La nota fue marcada como leída.", "success");
      } catch (error) {
        Swal.fire("Error", "Error al marcar la nota como leída.", "error");
        console.error("Error al marcar la nota como leída:", error);
      }
    }
  };

  // Eliminar una nota
  const eliminarNota = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará la nota de forma permanente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`http://localhost:4000/api/notas/${id}`);
        const notasActualizadas = notas.filter(nota => nota._id !== id);
        setNotas(notasActualizadas);
        
        // Recalcular las notas no leídas
        const cantidadNotasNoLeidas = notasActualizadas.filter(nota => !nota.leida).length;
        setNuevasNotas(cantidadNotasNoLeidas);
        
        Swal.fire("¡Eliminada!", "La nota fue eliminada correctamente.", "success");
      } catch (error) {
        Swal.fire("Error", "Error al eliminar la nota.", "error");
        console.error("Error al eliminar la nota:", error);
      }
    }
  };

  return (
    <div className="notas-admin-container">
      <NavBarForm />
      <h1>
        Notas de los Vendedores 
        {nuevasNotas > 0 && <span className="nueva-nota-indicador">{nuevasNotas}</span>} {/* Aquí mostramos la cantidad */}
      </h1>
      <ul className="notas-list">
        {notas.map((nota) => (
          <li key={nota._id} className={`nota-item ${nota.leida ? "leida" : ""}`}>
            <h3>
              {nota.titulo} 
              {!nota.leida && <span className="nueva-nota-indicador">!</span>}
            </h3>
            <p>{nota.contenido}</p>
            <small>
              Creada el: {nota.fechaCreacion}
            </small>
            <button
              onClick={() => marcarComoLeida(nota._id)}
              className={`mark-read-button ${nota.leida ? "disabled" : ""}`}
              disabled={nota.leida}
            >
              {nota.leida ? "Leída" : "Marcar como leída"}
            </button>
            <button
              onClick={() => eliminarNota(nota._id)}
              className="delete-button"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NotasAdmin;