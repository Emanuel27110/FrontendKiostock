import React from 'react';

const Usuarios = () => {
  return (
    <div>
      <h3>Lista de Usuarios:</h3>
      {/* Aquí podrías listar los usuarios del sistema */}
      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
          </tr>
        </thead>
        <tbody>
          {/* Aquí iría la lógica para mostrar los usuarios */}
          <tr>
            <td>Juan Perez</td>
            <td>juan@example.com</td>
            <td>Admin</td>
          </tr>
          <tr>
            <td>Ana Gomez</td>
            <td>ana@example.com</td>
            <td>Vendedor</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Usuarios;