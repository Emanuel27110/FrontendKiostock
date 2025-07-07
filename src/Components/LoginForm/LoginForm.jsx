import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './LoginForm.css';
import { FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2";
import { API_ENDPOINTS } from '../../config/api';

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Petición al backend para iniciar sesión
      const response = await axios.post(
        API_ENDPOINTS.LOGIN,
        { email, contraseña },
        { withCredentials: true } // Asegura que las cookies se envíen
      );
      const userRole = response.data.rol;

      // Redirección según el rol del usuario con `replace: true`
      if (userRole === "administrador") {
        Swal.fire({
          title: "Bienvenido, Admin!",
          icon: "success",
          confirmButtonText: "Continuar",
        }).then(() => {
          navigate("/admin", { replace: true }); // Usa `replace` para eliminar la página actual del historial
        });
      } else if (userRole === "vendedor") {
        Swal.fire({
          title: "Inicio de sesión bienvenido vendedor!",
          icon: "success",
          confirmButtonText: "Continuar",
        }).then(() => {
          navigate("/user", { replace: true }); // Redirección para el vendedor
        });
      }
    } catch (error) {
      console.error("Error al hacer login:", error);

      Swal.fire({
        title: "Error de conexión",
        text: "No se pudo conectar con el servidor.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      <div className='wrapper'>
        <form onSubmit={handleSubmit}>
          <h1>Login</h1>
          <div className='input-box'>
            <input
              type='text'
              placeholder='Email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <FaUser className="icon" />
          </div>
          <div className="input-box">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder='Contraseña'
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              required
            />
            <div 
              className="toggle-password"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
            <FaLock className="icon" />
          </div>
          <button type="submit">Iniciar</button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;