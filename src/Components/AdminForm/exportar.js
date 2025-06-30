import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable"; // Para facilitar la creación de tablas

// Función para exportar a Excel
export const exportarExcel = (productos) => {
  if (!productos || productos.length === 0) {
    alert("No hay productos disponibles para exportar.");
    return;
  }

  const datos = productos.map((producto) => ({
    Categoría: producto.categoria,
    Descripción: producto.descripcion,
    Precio: producto.precio,
    Stock: producto.stock,
    "Código de Barras": producto.codigoBarras,
  }));

  const hoja = XLSX.utils.json_to_sheet(datos);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Productos");

  XLSX.writeFile(libro, "productos.xlsx");
};

// Función para exportar a PDF
export const exportarPDF = (productos) => {
  if (!productos || productos.length === 0) {
    alert("No hay productos disponibles para exportar.");
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text("Listado de Productos", 14, 20);

  const columnas = ["Categoría", "Descripción", "Precio", "Stock", "Código de Barras"];
  const filas = productos.map((producto) => [
    producto.categoria,
    producto.descripcion,
    `$${producto.precio.toFixed(2)}`,
    producto.stock,
    producto.codigoBarras,
  ]);

  doc.autoTable({
    head: [columnas],
    body: filas,
    startY: 30,
    styles: { fontSize: 10 },
  });

  doc.save("productos.pdf");
};
