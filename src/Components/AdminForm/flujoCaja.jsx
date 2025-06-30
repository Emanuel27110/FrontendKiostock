import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import axios from "axios";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import NavBarForm from "../NavBarForm/NavBarForm";
import './FlujoCaja.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Hook personalizado para manejar fechas
const useDateRange = () => {
    // Fechas predeterminadas: último mes hasta hoy
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);

    const formatDate = (date) => {
        return date.toISOString().split('T')[0];
    };

    const [startDate, setStartDate] = useState(formatDate(oneMonthAgo));
    const [endDate, setEndDate] = useState(formatDate(today));

    const validateDates = useCallback(() => {
        if (!startDate || !endDate) {
            alert("Por favor, seleccione fechas de inicio y fin");
            return false;
        }
        
        if (new Date(startDate) > new Date(endDate)) {
            alert("La fecha de inicio debe ser anterior o igual a la fecha de fin");
            return false;
        }
        
        return true;
    }, [startDate, endDate]);

    const resetDates = useCallback(() => {
        setStartDate(formatDate(oneMonthAgo));
        setEndDate(formatDate(today));
    }, []);

    return {
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        validateDates,
        resetDates
    };
};

// Componente de filtro de fechas
const DateFilter = ({ startDate, endDate, setStartDate, setEndDate, tipoVenta, setTipoVenta, onFilter, onClear }) => {
    return (
        <div className="date-filter">
            <div className="filter-fields">
                <div className="date-input-group">
                    <label htmlFor="startDate">Fecha de inicio:</label>
                    <input
                        type="date"
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        aria-label="Fecha de inicio"
                    />
                </div>
                <div className="date-input-group">
                    <label htmlFor="endDate">Fecha de fin:</label>
                    <input
                        type="date"
                        id="endDate"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        aria-label="Fecha de fin"
                    />
                </div>
                
                <div className="tipo-venta-select">
                    <label htmlFor="tipoVenta">Tipo de Venta:</label>
                    <select 
                        id="tipoVenta" 
                        value={tipoVenta} 
                        onChange={(e) => setTipoVenta(e.target.value)}
                        aria-label="Seleccionar tipo de venta"
                    >
                        <option value="todos">Todos</option>
                        <option value="productos">Solo Productos</option>
                        <option value="embutidos">Solo Embutidos</option>
                    </select>
                </div>
            </div>
            <div className="filter-buttons">
                <button 
                    onClick={onFilter} 
                    className="filter-button"
                    aria-label="Aplicar filtros"
                >
                    Filtrar
                </button>
                <button 
                    onClick={onClear} 
                    className="clear-button"
                    aria-label="Limpiar filtros"
                >
                    Limpiar Filtros
                </button>
            </div>
        </div>
    );
};

// Componente de botones de exportación
const ExportButtons = ({ onExportExcel, onExportPDF }) => {
    return (
        <div className="export-buttons">
            <button 
                onClick={onExportExcel} 
                className="export-button excel"
                aria-label="Exportar a Excel"
            >
                Exportar a Excel
            </button>
            <button 
                onClick={onExportPDF} 
                className="export-button pdf"
                aria-label="Exportar a PDF"
            >
                Exportar a PDF
            </button>
        </div>
    );
};

// Componente para mostrar un gráfico individual
const ChartComponent = ({ title, data, chartType, className }) => {
    return (
        <div className={`chart-container ${className}`}>
            <h3>{title}</h3>
            <Bar
                data={data}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "top" },
                        title: { display: true, text: title },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let value = context.raw || 0;
                                    return `$ ${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback: function(value) {
                                    return `$ ${value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
                                }
                            }
                        }
                    }
                }}
            />
        </div>
    );
};

// Componente principal
const FlujoCaja = () => {
    // Estados para los datos de gráficos
    const [chartData, setChartData] = useState({
        todos: {
            diario: {},
            semanal: {},
            mensual: {}
        },
        productos: {
            diario: {},
            semanal: {},
            mensual: {}
        },
        embutidos: {
            diario: {},
            semanal: {},
            mensual: {}
        }
    });
    
    const [loading, setLoading] = useState(true);
    const [tipoVenta, setTipoVenta] = useState("todos");
    const { startDate, endDate, setStartDate, setEndDate, validateDates, resetDates } = useDateRange();
    
    // Función para agrupar ventas por periodo (día, semana, mes)
    const agruparVentas = useCallback((ventas, tipoPeriodo, campoTotal = "total") => {
        if (!ventas || ventas.length === 0) return [];
        
        const ventasAgrupadas = {};
        
        ventas.forEach(venta => {
            if (!venta.createdAt) return;
            
            const fecha = new Date(venta.createdAt);
            let periodoKey;
            
            switch(tipoPeriodo) {
                case 'dia':
                    periodoKey = fecha.toISOString().split('T')[0];
                    break;
                case 'semana':
                    periodoKey = getWeekNumber(fecha);
                    break;
                case 'mes':
                    periodoKey = fecha.getMonth() + 1;
                    break;
                default:
                    periodoKey = fecha.toISOString().split('T')[0];
            }
            
            if (!ventasAgrupadas[periodoKey]) {
                ventasAgrupadas[periodoKey] = 0;
            }
            
            const valor = venta[campoTotal] || 0;
            ventasAgrupadas[periodoKey] += valor;
        });
        
        return Object.keys(ventasAgrupadas).map(key => ({
            _id: key,
            total: ventasAgrupadas[key]
        })).sort((a, b) => {
            // Para fechas, usar comparación de fechas
            if (tipoPeriodo === 'dia') {
                return new Date(a._id) - new Date(b._id);
            }
            // Para semanas y meses, usar comparación numérica
            return Number(a._id) - Number(b._id);
        });
    }, []);
    
    // Función para obtener el número de semana del año
    const getWeekNumber = useCallback((date) => {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }, []);
    
    // Función para preparar datos para gráficos
    const prepararDatosGrafico = useCallback((ventasAgrupadas, etiqueta, colorFondo) => {
        const labels = ventasAgrupadas.map(venta => venta._id);
        const data = ventasAgrupadas.map(venta => venta.total);
        
        return {
            labels,
            datasets: [
                {
                    label: etiqueta,
                    data,
                    backgroundColor: colorFondo,
                },
            ],
        };
    }, []);
    
    // Función para obtener datos de la API
    const fetchData = useCallback(async () => {
        if (!validateDates()) {
            return;
        }
        
        setLoading(true);
        
        try {
            // Realizar todas las llamadas en paralelo para mejorar el rendimiento
            const [responseCombined, responseProductos, responseEmbutidos] = await Promise.all([
                axios.get("http://localhost:4000/api/caja", {
                    params: { startDate, endDate }
                }),
                axios.get("http://localhost:4000/api/ventas", {
                    params: { startDate, endDate }
                }),
                axios.get("http://localhost:4000/api/ventas-embutidos", {
                    params: { startDate, endDate }
                })
            ]);
            
            // Datos combinados desde la API
            const { ventasDiarias, ventasSemanales, ventasMensuales } = responseCombined.data;
            
            // Procesar datos de productos
            const ventasProductos = responseProductos.data;
            const ventasDiariasProductos = agruparVentas(ventasProductos, 'dia');
            const ventasSemanalesProductos = agruparVentas(ventasProductos, 'semana');
            const ventasMensualesProductos = agruparVentas(ventasProductos, 'mes');
            
            // Procesar datos de embutidos
            const ventasEmbutidos = responseEmbutidos.data;
            const ventasDiariasEmbutidos = agruparVentas(ventasEmbutidos, 'dia', "precioTotal");
            const ventasSemanalesEmbutidos = agruparVentas(ventasEmbutidos, 'semana', "precioTotal");
            const ventasMensualesEmbutidos = agruparVentas(ventasEmbutidos, 'mes', "precioTotal");
            
            // Actualizar estado de datos de gráficos
            setChartData({
                todos: {
                    diario: prepararDatosGrafico(ventasDiarias, "Venta Total Diaria", "rgba(75, 192, 192, 0.5)"),
                    semanal: prepararDatosGrafico(ventasSemanales.map(v => ({
                        _id: `Semana ${v._id}`,
                        total: v.total
                    })), "Venta Total Semanal", "rgba(153, 102, 255, 0.5)"),
                    mensual: prepararDatosGrafico(ventasMensuales.map(v => ({
                        _id: `Mes ${v._id}`,
                        total: v.total
                    })), "Venta Total Mensual", "rgba(255, 159, 64, 0.5)")
                },
                productos: {
                    diario: prepararDatosGrafico(ventasDiariasProductos, "Venta Diaria de Productos", "rgba(54, 162, 235, 0.5)"),
                    semanal: prepararDatosGrafico(ventasSemanalesProductos.map(v => ({
                        _id: `Semana ${v._id}`,
                        total: v.total
                    })), "Venta Semanal de Productos", "rgba(54, 162, 235, 0.5)"),
                    mensual: prepararDatosGrafico(ventasMensualesProductos.map(v => ({
                        _id: `Mes ${v._id}`,
                        total: v.total
                    })), "Venta Mensual de Productos", "rgba(54, 162, 235, 0.5)")
                },
                embutidos: {
                    diario: prepararDatosGrafico(ventasDiariasEmbutidos, "Venta Diaria de Embutidos", "rgba(255, 99, 132, 0.5)"),
                    semanal: prepararDatosGrafico(ventasSemanalesEmbutidos.map(v => ({
                        _id: `Semana ${v._id}`,
                        total: v.total
                    })), "Venta Semanal de Embutidos", "rgba(255, 99, 132, 0.5)"),
                    mensual: prepararDatosGrafico(ventasMensualesEmbutidos.map(v => ({
                        _id: `Mes ${v._id}`,
                        total: v.total
                    })), "Venta Mensual de Embutidos", "rgba(255, 99, 132, 0.5)")
                }
            });
            
            setLoading(false);
        } catch (error) {
            console.error("Error al obtener las ventas:", error);
            alert(`Error al cargar datos: ${error.message || 'Error desconocido'}`);
            setLoading(false);
        }
    }, [startDate, endDate, agruparVentas, prepararDatosGrafico, validateDates]);
    
    // Cargar datos al montar el componente
    useEffect(() => {
        fetchData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    
    // Manejadores de eventos
    const handleDateChange = useCallback(() => {
        fetchData();
    }, [fetchData]);
    
    const handleClearFilters = useCallback(() => {
        resetDates();
        setTipoVenta("todos");
        setTimeout(() => {
            fetchData();
        }, 50);
    }, [resetDates, fetchData]);
    
    const handleTipoVentaChange = useCallback((tipo) => {
        setTipoVenta(tipo);
    }, []);
    
    // Funciones para exportación
    const getDataForExport = useCallback(() => {
        const data = chartData[tipoVenta];
        const tipoVentaText = tipoVenta === "todos" ? "Todas" : 
                             (tipoVenta === "productos" ? "Productos" : "Embutidos");
        
        return {
            dailyData: data.diario,
            weeklyData: data.semanal,
            monthlyData: data.mensual,
            tipoVentaText
        };
    }, [chartData, tipoVenta]);
    
    const exportToExcel = useCallback(() => {
        const { dailyData, weeklyData, monthlyData, tipoVentaText } = getDataForExport();
        const workbook = XLSX.utils.book_new();
        
        // Datos diarios
        if (dailyData.labels && dailyData.labels.length > 0) {
            const data = dailyData.labels.map((date, index) => ({
                Fecha: date,
                [`Ganancia (${tipoVentaText})`]: dailyData.datasets[0].data[index]
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, ws, `${tipoVentaText}_Ventas_Diarias`);
        }
        
        // Datos semanales
        if (weeklyData.labels && weeklyData.labels.length > 0) {
            const data = weeklyData.labels.map((week, index) => ({
                Semana: week,
                [`Ganancia (${tipoVentaText})`]: weeklyData.datasets[0].data[index]
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, ws, `${tipoVentaText}_Ventas_Semanales`);
        }
        
        // Datos mensuales
        if (monthlyData.labels && monthlyData.labels.length > 0) {
            const data = monthlyData.labels.map((month, index) => ({
                Mes: month,
                [`Ganancia (${tipoVentaText})`]: monthlyData.datasets[0].data[index]
            }));
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, ws, `${tipoVentaText}_Ventas_Mensuales`);
        }
        
        // Exportar el archivo
        XLSX.writeFile(workbook, `Reporte_Ventas_${tipoVentaText}_${startDate}_${endDate}.xlsx`);
    }, [getDataForExport, startDate, endDate]);
    
    const exportToPDF = useCallback(() => {
        const { tipoVentaText } = getDataForExport();
        const doc = new jsPDF();
        
        // Determinar qué gráficos exportar según el filtro actual
        const chartsToExport = document.querySelectorAll(`.chart-container.${tipoVenta} canvas`);
        
        // Título y período
        doc.setFontSize(16);
        doc.text(`Reporte de Ventas (${tipoVentaText}): ${startDate} al ${endDate}`, 14, 20);
        
        // Exportar gráficos como imágenes
        let yPosition = 30;
        
        for (let i = 0; i < chartsToExport.length; i++) {
            const canvas = chartsToExport[i];
            const imgData = canvas.toDataURL('image/png');
            
            // Agregar título del gráfico
            doc.setFontSize(14);
            const titles = ['Ventas Diarias', 'Ventas Semanales', 'Ventas Mensuales'];
            doc.text(`${tipoVentaText} - ${titles[i]}`, 14, yPosition);
            
            // Agregar gráfico
            doc.addImage(imgData, 'PNG', 10, yPosition + 10, 190, 100);
            
            yPosition += 120;
            
            // Si no hay espacio suficiente, crear nueva página
            if (yPosition > 250 && i < chartsToExport.length - 1) {
                doc.addPage();
                yPosition = 20;
            }
        }
        
        doc.save(`Reporte_Ventas_${tipoVentaText}_${startDate}_${endDate}.pdf`);
    }, [getDataForExport, startDate, endDate, tipoVenta]);
    
    // Renderizar gráficos basados en el filtro seleccionado
    const renderCharts = useCallback(() => {
        const data = chartData[tipoVenta];
        const className = tipoVenta;
        
        // Definición de títulos
        const chartTitles = {
            todos: {
                diario: "Ventas Totales Diarias (Productos + Embutidos)",
                semanal: "Ventas Totales Semanales (Productos + Embutidos)",
                mensual: "Ventas Totales Mensuales (Productos + Embutidos)"
            },
            productos: {
                diario: "Ventas Diarias de Productos",
                semanal: "Ventas Semanales de Productos",
                mensual: "Ventas Mensuales de Productos"
            },
            embutidos: {
                diario: "Ventas Diarias de Embutidos",
                semanal: "Ventas Semanales de Embutidos",
                mensual: "Ventas Mensuales de Embutidos"
            }
        };
        
        return (
            <>
                <ChartComponent 
                    title={chartTitles[tipoVenta].diario}
                    data={data.diario}
                    chartType="diario"
                    className={className}
                />
                
                <ChartComponent 
                    title={chartTitles[tipoVenta].semanal}
                    data={data.semanal}
                    chartType="semanal"
                    className={className}
                />
                
                <ChartComponent 
                    title={chartTitles[tipoVenta].mensual}
                    data={data.mensual}
                    chartType="mensual"
                    className={className}
                />
            </>
        );
    }, [chartData, tipoVenta]);
    
    // Comprueba si los datos están listos para mostrar
    const datosDisponibles = useMemo(() => {
        const data = chartData[tipoVenta];
        return (
            data &&
            data.diario && data.diario.labels && data.diario.labels.length > 0 &&
            data.semanal && data.semanal.labels && data.semanal.labels.length > 0 &&
            data.mensual && data.mensual.labels && data.mensual.labels.length > 0
        );
    }, [chartData, tipoVenta]);
    
    // Componente de carga
    if (loading) {
        return (
            <div className="fluxo-caja-container">
                <NavBarForm />
                <div className="loading">
                    <div className="spinner" aria-label="Cargando"></div>
                    <p>Cargando datos de ventas...</p>
                </div>
            </div>
        );
    }
    
    // Componente principal
    return (
        <div className="fluxo-caja-container">
            <NavBarForm />
            <h2>Flujo de Caja</h2>
            
            <DateFilter 
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                tipoVenta={tipoVenta}
                setTipoVenta={handleTipoVentaChange}
                onFilter={handleDateChange}
                onClear={handleClearFilters}
            />
            
            <ExportButtons 
                onExportExcel={exportToExcel}
                onExportPDF={exportToPDF}
            />
            
            {datosDisponibles ? (
                renderCharts()
            ) : (
                <div className="no-data-message">
                    <p>No hay datos disponibles para el período seleccionado.</p>
                </div>
            )}
        </div>
    );
};

export default FlujoCaja;