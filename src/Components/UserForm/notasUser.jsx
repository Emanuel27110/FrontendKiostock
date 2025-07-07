import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import NavBarUser from "../NavBarForm/NavBarUser";
import './notasUser.css';
import { API_ENDPOINTS } from '../../config/api';

function NotasUser() {
  const [notas, setNotas] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");

  // Cargar notas del vendedor al cargar el componente
  useEffect(() => {
    const fetchNotas = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.NOTAS);
        // Filtrar notas creadas por el vendedor
        const notasVendedor = response.data.filter((nota) => nota.creadaPor === "vendedor");
        setNotas(notasVendedor);
      } catch (error) {
        Swal.fire("Error", "No se pudieron obtener las notas.", "error");
        console.error("Error al obtener las notas:", error);
      }
    };

    fetchNotas();
  }, []);

  // Manejar la creación de una nueva nota
  const handleCrearNota = async (e) => {
    e.preventDefault();

    if (!titulo || !contenido) {
      Swal.fire("Atención", "Completa todos los campos antes de continuar.", "warning");
      return;
    }

    try {
      const response = await axios.post(API_ENDPOINTS.NOTAS, {
        titulo,
        contenido,
        creadaPor: "vendedor",
      });

      // Añadir la nueva nota al listado
      setNotas([response.data, ...notas]);
      setTitulo("");
      setContenido("");

      Swal.fire("¡Éxito!", "La nota se creó correctamente.", "success");
    } catch (error) {
      Swal.fire("Error", "Hubo un problema al crear la nota.", "error");
      console.error("Error al crear la nota:", error);
    }
  };

  return (
    <div className="notas-user-container">
      <NavBarUser />
      <h1>Notas para el Administrador</h1>

      {/* Formulario para crear una nota */}
      <form onSubmit={handleCrearNota} className="notas-form">
        <div className="form-group">
          <label htmlFor="titulo">Título:</label>
          <input
            id="titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <div className="form-group">
          <label htmlFor="contenido">Contenido:</label>
          <textarea
            id="contenido"
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            required
            className="input-field"
          />
        </div>
        <button type="submit" className="submit-button">Crear Nota</button>
      </form>

      {/* Listado de notas */}
      <h2>Mis Notas</h2>
      <ul className="notas-list">
        {notas.map((nota) => (
          <li key={nota._id} className={`nota-item ${nota.leida ? "leida" : ""}`}>
            <h3>{nota.titulo}</h3>
            <p>{nota.contenido}</p>
            <small>Creada el: {nota.fechaCreacion}</small>
            <small>{nota.leida ? "Leída por el admin" : "Pendiente"}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NotasUser;
