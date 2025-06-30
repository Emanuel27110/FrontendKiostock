import React, { useState, useEffect } from "react";
import './AdminForm.css';
import NavBarForm from "../NavBarForm/NavBarForm";
import { FaUser, FaLock, FaUserTag, FaTrash, FaEdit } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";

const AdminForm = () => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [rol, setRol] = useState("vendedor");
  const [usuarios, setUsuarios] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Función para cargar usuarios
  const cargarUsuarios = async () => {
    try {
      console.log('Intentando cargar usuarios...'); // Debug
      const response = await axios.get("http://localhost:4000/api/users", { 
        withCredentials: true 
      });
      console.log('Respuesta del servidor:', response.data); // Debug
      setUsuarios(response.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error.response || error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudieron cargar los usuarios',
        icon: 'error'
      });
    }
  };

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const resetForm = () => {
    setNombre("");
    setEmail("");
    setContraseña("");
    setRol("vendedor");
    setEditMode(false);
    setCurrentUserId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode) {
        // Actualizar usuario existente
        await axios.put(
          `http://localhost:4000/api/users/${currentUserId}`,
          { nombre, email, rol, contraseña: contraseña || undefined }, // Solo envía la contraseña si se ha modificado
          { withCredentials: true }
        );

        Swal.fire({
          title: "¡Usuario actualizado exitosamente!",
          icon: "success",
          confirmButtonText: "Continuar",
        });
      } else {
        // Crear nuevo usuario
        await axios.post(
          "http://localhost:4000/api/register",
          { nombre, email, contraseña, rol },
          { withCredentials: true }
        );

        Swal.fire({
          title: "¡Usuario creado exitosamente!",
          text: `Usuario creado como: ${rol}`,
          icon: "success",
          confirmButtonText: "Continuar",
        });
      }

      resetForm();
      // Recargar la lista de usuarios
      cargarUsuarios();
      
    } catch (error) {
      console.error("Error al procesar usuario:", error);
      
      Swal.fire({
        title: editMode ? "Error al actualizar usuario" : "Error al crear usuario",
        text: error.response?.data?.message || "Error de conexión",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    }
  };

  const handleEdit = (usuario) => {
    setNombre(usuario.nombre);
    setEmail(usuario.email);
    setContraseña(""); // No mostrar la contraseña actual por seguridad
    setRol(usuario.rol);
    setEditMode(true);
    setCurrentUserId(usuario._id);
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleDelete = async (userId) => {
    try {
      await Swal.fire({
        title: '¿Estás seguro?',
        text: "No podrás revertir esta acción",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await axios.delete(`http://localhost:4000/api/users/${userId}`, 
            { withCredentials: true }
          );
          cargarUsuarios();
          Swal.fire(
            '¡Eliminado!',
            'El usuario ha sido eliminado.',
            'success'
          );
        }
      });
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      Swal.fire(
        'Error',
        'No se pudo eliminar el usuario.',
        'error'
      );
    }
  };

  return (
    <div className="admin-container">
      <NavBarForm />
      <div className='admin-wrapper'>
        <div className="admin-content">
          <div className="admin-form-container">
            <h1 className="admin-title">
              {editMode ? "Editar Usuario" : "Crear Nuevo Usuario"}
            </h1>
            <p className="admin-subtitle">
              {editMode ? "Actualice los datos del usuario" : "Complete los datos del nuevo usuario"}
            </p>
            
            <form onSubmit={handleSubmit} className="admin-form">
              <div className='admin-input-box'>
                <label>Nombre</label>
                <div className="input-with-icon">
                  <input
                    type='text'
                    placeholder='Ingrese el nombre completo'
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                  <FaUser className="admin-icon" />
                </div>
              </div>

              <div className='admin-input-box'>
                <label>Correo Electrónico</label>
                <div className="input-with-icon">
                  <input
                    type='email'
                    placeholder='Ingrese el correo electrónico'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <FaUser className="admin-icon" />
                </div>
              </div>

              <div className="admin-input-box">
                <label>{editMode ? "Nueva Contraseña (dejar en blanco para mantener la actual)" : "Contraseña"}</label>
                <div className="input-with-icon">
                  <input
                    type='password'
                    placeholder={editMode ? 'Ingrese nueva contraseña (opcional)' : 'Ingrese la contraseña'}
                    value={contraseña}
                    onChange={(e) => setContraseña(e.target.value)}
                    required={!editMode}
                  />
                  <FaLock className="admin-icon" />
                </div>
              </div>

              <div className="admin-input-box">
                <label>Rol del Usuario</label>
                <div className="input-with-icon">
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    required
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="administrador">Administrador</option>
                  </select>
                  <FaUserTag className="admin-icon" />
                </div>
              </div>

              <div className="admin-button-group">
                <button type="submit" className="admin-button">
                  {editMode ? "Actualizar Usuario" : "Crear Usuario"}
                </button>
                
                {editMode && (
                  <button 
                    type="button" 
                    className="admin-button cancel" 
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="users-list-container">
            <h2 className="users-title">Usuarios Registrados</h2>
            <div className="users-table-container">
              {usuarios.length > 0 ? (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario._id}>
                        <td>{usuario.nombre}</td>
                        <td>{usuario.email}</td>
                        <td>
                          <span className={`role-badge ${usuario.rol}`}>
                            {usuario.rol}
                          </span>
                        </td>
                        <td className="action-buttons">
                          <button 
                            className="action-button edit"
                            onClick={() => handleEdit(usuario)}
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="action-button delete"
                            onClick={() => handleDelete(usuario._id)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-users-message">No hay usuarios registrados</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminForm;