import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RendimientoDashboard.css';
import NavBarForm from "../NavBarForm/NavBarForm";
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Crear una instancia de Axios con URL base
const api = axios.create({
  baseURL: 'http://localhost:4000/api'
});

const RendimientoDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendedores, setVendedores] = useState([]);
  const [rendimientoData, setRendimientoData] = useState([]);
  const [tipoVenta, setTipoVenta] = useState('todas');
  const [periodo, setPeriodo] = useState('mes');
  const [fechaInicio, setFechaInicio] = useState(new Date(new Date().setDate(1))); // Primer día del mes actual
  const [fechaFin, setFechaFin] = useState(new Date());
  const [incluirAdmins, setIncluirAdmins] = useState(true); // Estado para incluir admins
  
  useEffect(() => {
    const fetchVendedores = async () => {
      try {
        // Pasar el parámetro incluirAdmins al endpoint de vendedores
        const response = await api.get('/vendedores', {
          params: {
            incluirAdmins: incluirAdmins.toString()
          }
        });
        setVendedores(response.data);
        setError(null); // Limpiar cualquier error previo
      } catch (err) {
        console.error('Error al cargar vendedores:', err);
        
        // Mensajes de error más específicos
        if (err.response) {
          if (err.response.status === 404) {
            setError('El endpoint de vendedores no fue encontrado. Verifica la configuración del backend.');
          } else {
            setError(`Error del servidor: ${err.response.status} - ${err.response.data.message || 'Sin detalles adicionales'}`);
          }
        } else if (err.request) {
          setError('No se recibió respuesta del servidor. Verifica que el backend esté en ejecución.');
        } else {
          setError(`Error inesperado: ${err.message}`);
        }
      }
    };
    
    fetchVendedores();
  }, [incluirAdmins]); // Añadir incluirAdmins como dependencia
  
  useEffect(() => {
    const fetchRendimientoData = async () => {
      try {
        setLoading(true);
        
        const formattedFechaInicio = fechaInicio.toISOString().split('T')[0];
        const adjustedFechaFin = new Date(fechaFin);
adjustedFechaFin.setDate(adjustedFechaFin.getDate() + 1);
const formattedFechaFin = adjustedFechaFin.toISOString().split('T')[0];

        
        console.log('Consultando datos de rendimiento:', {
          tipoVenta, 
          periodo, 
          fechaInicio: formattedFechaInicio, 
          fechaFin: formattedFechaFin,
          incluirAdmins 
        });
        
        // Usar la instancia de api con la URL base correcta y pasar el parámetro incluirAdmins
        const response = await api.get(`/rendimiento`, {
          params: {
            tipoVenta,
            periodo,
            fechaInicio: formattedFechaInicio,
            fechaFin: formattedFechaFin,
            incluirAdmins: incluirAdmins.toString() // Convertir el booleano a string para la API
          }
        });
        
        // Si la respuesta tiene un formato diferente al esperado, adaptarla
        let datosFormateados = response.data;
        if (response.data.vendedores) {
          // Si el backend devuelve un objeto con una propiedad "vendedores"
          datosFormateados = response.data.vendedores;
        }
        
        setRendimientoData(datosFormateados);
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos de rendimiento:', err);
        
        // Mensajes de error más específicos
        if (err.response) {
          if (err.response.status === 404) {
            setError('El endpoint de rendimiento no fue encontrado. Verifica la configuración del backend.');
          } else {
            setError(`Error del servidor: ${err.response.status} - ${err.response.data.message || 'Sin detalles adicionales'}`);
          }
        } else if (err.request) {
          setError('No se recibió respuesta del servidor. Verifica que el backend esté en ejecución.');
        } else {
          setError(`Error inesperado: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchRendimientoData();
  }, [tipoVenta, periodo, fechaInicio, fechaFin, incluirAdmins]); // Añadido incluirAdmins como dependencia
  
  const handlePeriodoChange = (e) => {
    const value = e.target.value;
    setPeriodo(value);
    
    // Ajustar fechas según el período seleccionado
    const today = new Date();
    let newFechaInicio = new Date();
    
    switch (value) {
      case 'dia':
        newFechaInicio = new Date(today);
        break;
      case 'semana':
        newFechaInicio = new Date(today);
        newFechaInicio.setDate(today.getDate() - 7);
        break;
      case 'mes':
        newFechaInicio = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'año':
        newFechaInicio = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        newFechaInicio = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    
    setFechaInicio(newFechaInicio);
    setFechaFin(today);
  };
  
  // Nueva función para limpiar filtros de fecha
  const handleLimpiarFiltros = () => {
    const today = new Date();
    setFechaInicio(new Date(today.getFullYear(), today.getMonth(), 1)); // Primer día del mes actual
    setFechaFin(new Date()); // Día actual
    setPeriodo('mes'); // Restablecer el período a 'mes'
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value);
  };

  // Función para exportar a Excel
  const exportToExcel = () => {
    if (loading || rendimientoData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    try {
      // Preparar los datos para la exportación
      const totalVentas = rendimientoData.reduce((sum, v) => sum + v.montoTotal, 0);
      
      // Datos para la tabla
      const dataForExport = rendimientoData.map(item => {
        const porcentaje = totalVentas ? ((item.montoTotal / totalVentas) * 100).toFixed(2) : '0.00';
        const promedio = item.cantidadVentas ? (item.montoTotal / item.cantidadVentas) : 0;
        
        return {
          'Vendedor': item.nombre,
          // Corregido: Usar el valor correcto de esAdmin
          'Rol': item.esAdmin ? 'Admin' : 'Vendedor',
          'Cantidad de Ventas': item.cantidadVentas,
          'Monto Total': item.montoTotal,
          'Promedio por Venta': promedio,
          '% del Total': `${porcentaje}%`
        };
      });

      // Datos para el resumen
      const summaryData = [
        {
          'Resumen': 'Total de Ventas',
          'Valor': rendimientoData.reduce((sum, item) => sum + item.montoTotal, 0)
        },
        {
          'Resumen': 'Cantidad de Ventas',
          'Valor': rendimientoData.reduce((sum, item) => sum + item.cantidadVentas, 0)
        },
        {
          'Resumen': 'Promedio por Venta',
          'Valor': rendimientoData.reduce((sum, item) => sum + item.montoTotal, 0) / 
                  Math.max(1, rendimientoData.reduce((sum, item) => sum + item.cantidadVentas, 0))
        }
      ];

      // Crear la hoja de cálculo
      const wb = XLSX.utils.book_new();
      
      // Hoja 1: Detalle por vendedor
      const ws = XLSX.utils.json_to_sheet(dataForExport);
      XLSX.utils.book_append_sheet(wb, ws, "Detalle por Vendedor");

      // Hoja 2: Resumen
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

      // Crear el nombre del archivo
      const fileName = `Rendimiento_Vendedores_${fechaInicio.toISOString().split('T')[0]}_${fechaFin.toISOString().split('T')[0]}.xlsx`;

      // Exportar el archivo
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      alert('Error al exportar a Excel');
    }
  };

  // Función para exportar a PDF con gráfico
const exportToPDF = () => {
  if (loading || rendimientoData.length === 0) {
    alert('No hay datos para exportar');
    return;
  }

  try {
    // Primero crear una imagen del gráfico
    const chartElement = document.querySelector('.chart');
    
    // Usar html2canvas para convertir el gráfico en una imagen
    import('html2canvas').then(html2canvasModule => {
      const html2canvas = html2canvasModule.default;
      
      html2canvas(chartElement).then(canvas => {
        // Crear un nuevo documento PDF
        const doc = new jsPDF();
        
        // Configurar el título
        const title = `Rendimiento de Vendedores (${fechaInicio.toISOString().split('T')[0]} - ${fechaFin.toISOString().split('T')[0]})`;
        
        doc.setFontSize(16);
        doc.text(title, 14, 15);
        
        doc.setFontSize(12);
        doc.text(`Tipo de Venta: ${tipoVenta === 'todas' ? 'Todas' : tipoVenta === 'regular' ? 'Productos Regulares' : 'Embutidos'}`, 14, 25);
        doc.text(`Incluye Admins: ${incluirAdmins ? 'Sí' : 'No'}`, 14, 31);

        // Agregar resumen
        doc.setFontSize(14);
        doc.text('Resumen', 14, 40);
        
        const totalMontoVentas = rendimientoData.reduce((sum, item) => sum + item.montoTotal, 0);
        const totalCantidadVentas = rendimientoData.reduce((sum, item) => sum + item.cantidadVentas, 0);
        const promedioVenta = totalCantidadVentas > 0 ? totalMontoVentas / totalCantidadVentas : 0;

        const summaryTable = [
          ['Total de Ventas', formatCurrency(totalMontoVentas)],
          ['Cantidad de Ventas', totalCantidadVentas.toString()],
          ['Promedio por Venta', formatCurrency(promedioVenta)]
        ];

        doc.autoTable({
          startY: 45,
          head: [['Concepto', 'Valor']],
          body: summaryTable,
          theme: 'grid',
          styles: { fontSize: 10 }
        });
        
        // Agregar el gráfico como imagen
        doc.setFontSize(14);
        doc.text('Gráfico de Rendimiento', 14, doc.autoTable.previous.finalY + 10);
        
        // Convertir el canvas a imagen y añadirlo al PDF
        const imgData = canvas.toDataURL('image/png');
        
        // Calcular las dimensiones para que quepa bien en el PDF
        const imgWidth = 180; // Ancho en el PDF
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        doc.addImage(
          imgData, 
          'PNG', 
          14, // x position
          doc.autoTable.previous.finalY + 15, // y position
          imgWidth, 
          imgHeight
        );
        
        // Preparar la tabla detallada
        const totalVentas = rendimientoData.reduce((sum, v) => sum + v.montoTotal, 0);
        
        const tableData = rendimientoData.map(item => {
          const porcentaje = totalVentas ? ((item.montoTotal / totalVentas) * 100).toFixed(2) : '0.00';
          const promedio = item.cantidadVentas ? (item.montoTotal / item.cantidadVentas) : 0;
          
          return [
            item.nombre,
            item.esAdmin ? 'Admin' : 'Vendedor',
            item.cantidadVentas.toString(),
            formatCurrency(item.montoTotal),
            formatCurrency(promedio),
            `${porcentaje}%`
          ];
        });

        // Agregar tabla detallada en una nueva página si no hay espacio suficiente
        const remainingSpace = doc.internal.pageSize.height - (doc.autoTable.previous.finalY + 15 + imgHeight + 15);
        let startY;
        
        if (remainingSpace < 100) {
          doc.addPage();
          startY = 20;
        } else {
          startY = doc.autoTable.previous.finalY + 15 + imgHeight + 15;
        }
        
        doc.setFontSize(14);
        doc.text('Detalle por Vendedor', 14, startY);

        doc.autoTable({
          startY: startY + 5,
          head: [['Vendedor', 'Rol', 'Cant. Ventas', 'Monto Total', 'Promedio', '% del Total']],
          body: tableData,
          theme: 'striped',
          styles: { fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20, halign: 'right' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' },
            5: { cellWidth: 20, halign: 'right' }
          }
        });

        // Pie de página
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.text(
            `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString()}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }

        // Guardar el PDF
        const fileName = `Rendimiento_Vendedores_${fechaInicio.toISOString().split('T')[0]}_${fechaFin.toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
      });
    }).catch(err => {
      console.error('Error al cargar html2canvas:', err);
      alert('Error al convertir el gráfico. El PDF se exportará sin el gráfico.');
      exportToPDFWithoutChart(); // Fallback a la exportación sin gráfico
    });
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    alert('Error al exportar a PDF');
  }
};

// Función de fallback para exportar sin gráfico (tu implementación actual)
const exportToPDFWithoutChart = () => {
  try {
    // Crear un nuevo documento PDF
    const doc = new jsPDF();
    
    // Configurar el título
    const title = `Rendimiento de Vendedores (${fechaInicio.toISOString().split('T')[0]} - ${fechaFin.toISOString().split('T')[0]})`;
    
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    doc.setFontSize(12);
    doc.text(`Tipo de Venta: ${tipoVenta === 'todas' ? 'Todas' : tipoVenta === 'regular' ? 'Productos Regulares' : 'Embutidos'}`, 14, 25);
    doc.text(`Incluye Admins: ${incluirAdmins ? 'Sí' : 'No'}`, 14, 31);

    // Agregar resumen
    doc.setFontSize(14);
    doc.text('Resumen', 14, 40);
    
    const totalMontoVentas = rendimientoData.reduce((sum, item) => sum + item.montoTotal, 0);
    const totalCantidadVentas = rendimientoData.reduce((sum, item) => sum + item.cantidadVentas, 0);
    const promedioVenta = totalCantidadVentas > 0 ? totalMontoVentas / totalCantidadVentas : 0;

    const summaryTable = [
      ['Total de Ventas', formatCurrency(totalMontoVentas)],
      ['Cantidad de Ventas', totalCantidadVentas.toString()],
      ['Promedio por Venta', formatCurrency(promedioVenta)]
    ];

    doc.autoTable({
      startY: 45,
      head: [['Concepto', 'Valor']],
      body: summaryTable,
      theme: 'grid',
      styles: { fontSize: 10 }
    });
    
    // Preparar la tabla detallada
    const totalVentas = rendimientoData.reduce((sum, v) => sum + v.montoTotal, 0);
    
    const tableData = rendimientoData.map(item => {
      const porcentaje = totalVentas ? ((item.montoTotal / totalVentas) * 100).toFixed(2) : '0.00';
      const promedio = item.cantidadVentas ? (item.montoTotal / item.cantidadVentas) : 0;
      
      return [
        item.nombre,
        item.esAdmin ? 'Admin' : 'Vendedor',
        item.cantidadVentas.toString(),
        formatCurrency(item.montoTotal),
        formatCurrency(promedio),
        `${porcentaje}%`
      ];
    });

    // Agregar tabla detallada
    doc.setFontSize(14);
    doc.text('Detalle por Vendedor', 14, doc.autoTable.previous.finalY + 10);

    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 15,
      head: [['Vendedor', 'Rol', 'Cant. Ventas', 'Monto Total', 'Promedio', '% del Total']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' }
      }
    });

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString()}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Guardar el PDF
    const fileName = `Rendimiento_Vendedores_${fechaInicio.toISOString().split('T')[0]}_${fechaFin.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    alert('Error al exportar a PDF');
  }
};
  
  return (
    <div className="dashboard-container">
      <NavBarForm />
      <h1 className="dashboard-title">Dashboard de Rendimiento de Vendedores</h1>
      
      {/* Filtros */}
      <div className="filter-container">
        <div className="filter-group">
          <label htmlFor="tipoVenta">Tipo de Venta</label>
          <select 
            id="tipoVenta"
            value={tipoVenta} 
            onChange={(e) => setTipoVenta(e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="regular">Productos Regulares</option>
            <option value="embutido">Embutidos</option>
          </select>
        </div>
        
        {/* Filtro corregido para incluir/excluir admins */}
        <div className="filter-group">
          <label htmlFor="incluirAdmins">Administradores</label>
          <select 
            id="incluirAdmins"
            value={incluirAdmins.toString()} 
            onChange={(e) => setIncluirAdmins(e.target.value === 'true')}
          >
            <option value="true">Incluir</option>
            <option value="false">Excluir</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="periodo">Período</label>
          <select 
            id="periodo"
            value={periodo} 
            onChange={handlePeriodoChange}
          >
            <option value="dia">Hoy</option>
            <option value="semana">Última semana</option>
            <option value="mes">Mes actual</option>
            <option value="año">Año actual</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="fechaInicio">Fecha Inicio</label>
          <input 
            id="fechaInicio"
            type="date" 
            value={fechaInicio.toISOString().split('T')[0]}
            onChange={(e) => setFechaInicio(new Date(e.target.value))}
            disabled={periodo !== 'personalizado'}
          />
        </div>
        
        <div className="filter-group">
          <label htmlFor="fechaFin">Fecha Fin</label>
          <input 
            id="fechaFin"
            type="date" 
            value={fechaFin.toISOString().split('T')[0]}
            onChange={(e) => setFechaFin(new Date(e.target.value))}
            disabled={periodo !== 'personalizado'}
          />
        </div>
        
        {/* Nuevo botón para limpiar filtros de fecha */}
        <div className="filter-group">
          <button 
            onClick={handleLimpiarFiltros}
            className="filter-button clean"
          >
            Limpiar Filtros
          </button>
        </div>
      </div>
      
      {/* Botones de exportación */}
      <div className="export-buttons">
        <button 
          onClick={exportToExcel} 
          className="export-button excel"
          disabled={loading || rendimientoData.length === 0}
        >
          Exportar a Excel
        </button>
        <button 
          onClick={exportToPDF} 
          className="export-button pdf"
          disabled={loading || rendimientoData.length === 0}
        >
          Exportar a PDF
        </button>
      </div>
      
      {/* Tarjetas de resumen */}
      <div className="summary-cards">
        <div className="card">
          <h3>Total de Ventas</h3>
          <div className="card-value">
            {loading ? <div className="loading-spinner"></div> : 
              formatCurrency(rendimientoData.reduce((sum, item) => sum + item.montoTotal, 0))}
          </div>
        </div>
        
        <div className="card">
          <h3>Cantidad de Ventas</h3>
          <div className="card-value">
            {loading ? <div className="loading-spinner"></div> : 
              rendimientoData.reduce((sum, item) => sum + item.cantidadVentas, 0)}
          </div>
        </div>
        
        <div className="card">
          <h3>Promedio por Venta</h3>
          <div className="card-value">
            {loading ? <div className="loading-spinner"></div> : 
              formatCurrency(
                rendimientoData.reduce((sum, item) => sum + item.montoTotal, 0) / 
                Math.max(1, rendimientoData.reduce((sum, item) => sum + item.cantidadVentas, 0))
              )}
          </div>
        </div>
      </div>
      
      {/* Gráfico simple */}
      <div className="chart-container">
        <h2>Rendimiento de Vendedores {incluirAdmins ? '(incluye admins)' : ''}</h2>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="chart">
            {rendimientoData.map((item, index) => {
              const maxValue = Math.max(...rendimientoData.map(d => d.montoTotal));
              const barHeight = maxValue > 0 ? (item.montoTotal / maxValue) * 100 : 0;
              
              return (
                <div key={index} className="chart-column">
                  <div className="chart-bar-container">
                    <div 
                      className="chart-bar" 
                      style={{ 
                        height: `${barHeight}%`,
                        backgroundColor: item.esAdmin ? 'hsl(0, 70%, 60%)' : `hsl(${210 + index * 30}, 70%, 60%)`
                      }}
                      title={`${formatCurrency(item.montoTotal)}`}
                    ></div>
                  </div>
                  <div className="chart-label" title={`${item.nombre}${item.esAdmin ? ' (Admin)' : ''}`}>
                    {(item.nombre.length > 8 ? item.nombre.substring(0, 8) + '...' : item.nombre)}
                    {item.esAdmin && ' (A)'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Tabla de rendimiento */}
      <div className="table-container">
        <h2>Detalle de Rendimiento por Vendedor</h2>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th>Rol</th>
                  <th>Cant. Ventas</th>
                  <th>Monto Total</th>
                  <th>Promedio por Venta</th>
                  <th>% del Total</th>
                </tr>
              </thead>
              <tbody>
                {rendimientoData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-state">No hay datos disponibles</td>
                  </tr>
                ) : (
                  rendimientoData.map((item, index) => {
                    const totalVentas = rendimientoData.reduce((sum, v) => sum + v.montoTotal, 0);
                    const porcentaje = totalVentas ? ((item.montoTotal / totalVentas) * 100).toFixed(2) : '0.00';
                    const promedio = item.cantidadVentas ? (item.montoTotal / item.cantidadVentas) : 0;
                    
                    return (
                 
                      <tr key={index} className={item.esAdmin ? 'admin-row' : ''}>
                        <td>{item.nombre}</td>
                        {/* Corregido: Mostrar el rol correcto basado en esAdmin */}
                        <td>{item.esAdmin ? 'Admin' : 'Vendedor'}</td>
                        <td>{item.cantidadVentas}</td>
                        <td>{formatCurrency(item.montoTotal)}</td>
                        <td>{formatCurrency(promedio)}</td>
                        <td>{porcentaje}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RendimientoDashboard;