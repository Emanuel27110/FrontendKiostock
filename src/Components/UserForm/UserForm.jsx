import React from "react";
import kiosquitoImage from "./kiosquito.jpg"; // Importa la imagen
import NavBarUser from "../NavBarForm/NavBarUser";
import "./UserForm.css";

const UserForm = () => {
  return (
    <div
      className="user-welcome-container"
      style={{
        backgroundImage: `url(${kiosquitoImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        position: "relative",
      }}
    >
      <NavBarUser />
      <div className="welcome-overlay">
        <h1 className="welcome-title">
          ¡Bienvenido a Kiosco La Mendoza!
        </h1>
        <p className="welcome-phrase">
          "Donde cada pequeño esfuerzo cuenta y cada cliente es especial."
        </p>
      </div>
    </div>
  );
};

export default UserForm;