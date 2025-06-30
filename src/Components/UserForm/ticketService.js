import jsPDF from 'jspdf';
import 'jspdf-autotable';
import logo from './logo.png';  // Importación del logo desde la misma carpeta

// Función para generar un ticket de venta en PDF
export const generarTicketPDF = async (venta, negocio = {
  nombre: "Drugstore La Mendoza",
  direccion: "Mendoza al 307",
  telefono: "381-409-8618",
  email: "lamendoza@gmail.com"
}) => {
  return new Promise((resolve, reject) => {
    // Validar que recibimos un objeto de venta correcto
    if (!venta || typeof venta !== 'object') {
      console.error("Error: No se recibió un objeto de venta válido", venta);
      reject(new Error("Objeto de venta inválido"));
      return;
    }
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Configuración de márgenes y tamaños
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15; // Aumentado para más espacio en los bordes
    const contentWidth = pageWidth - 2 * margin;
    
    // Posición vertical actual
    let y = margin + 5; // Empezamos un poco más abajo
    
    // Configuración de fuentes
    doc.setFontSize(12);
    
    // Función para centrar texto
    const centrarTexto = (texto, yPos) => {
      const textWidth = doc.getStringUnitWidth(texto) * doc.internal.getFontSize() / doc.internal.scaleFactor;
      const x = (pageWidth - textWidth) / 2;
      doc.text(texto, x, yPos);
      return doc.getTextDimensions(texto).h;
    };
    
    // Añadir logo
    try {
      const imgWidth = 40;
      const imgHeight = 40;
      const imgX = (pageWidth - imgWidth) / 2;
      
      doc.addImage(logo, 'PNG', imgX, y, imgWidth, imgHeight);
      y += imgHeight + 10; // Más espacio después del logo
    } catch (e) {
      console.error("Error al añadir el logo:", e);
      // Continuar sin logo si hay error
    }
    
    // Título del ticket
    doc.setFontSize(18); // Aumentamos el tamaño
    doc.setFont(undefined, 'bold');
    y += centrarTexto(negocio.nombre, y + 8) + 6;
    
    // Información del negocio
    doc.setFontSize(11); // Ligeramente más grande
    doc.setFont(undefined, 'normal');
    y += centrarTexto(negocio.direccion, y) + 4;
    y += centrarTexto(`Tel: ${negocio.telefono}`, y) + 4;
    y += centrarTexto(negocio.email, y) + 10; // Más espacio antes de la línea divisoria
    
    // Línea divisoria
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8; // Más espacio después de la línea
    
    // Información de la venta
    doc.setFontSize(12);
    const ticketNum = venta._id ? venta._id.substring(0, 8) : 'N/A'; // Usamos 8 caracteres para el ID
    doc.text(`Ticket de Venta #${ticketNum}`, margin, y);
    y += 8;
    
    doc.setFontSize(10);
    const fechaFormateada = new Date(venta.createdAt).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    doc.text(`Fecha: ${fechaFormateada}`, margin, y);
    y += 6;
    doc.text(`Vendedor: ${venta.vendedor}`, margin, y);
    y += 6;
    doc.text(`Método de pago: ${venta.metodoPago}`, margin, y);
    y += 10; // Más espacio antes de la tabla
    
    // Tabla de productos y promociones
const tableColumn = ["Producto", "Cant.", "Precio Unit.", "Subtotal"];
const tableRows = [];

// Productos normales
if (Array.isArray(venta.productos)) {
  venta.productos.forEach(producto => {
    const cantidad = Number(producto.cantidad) || 0;
    const subtotal = Number(producto.subtotal) || 0;
    const precioUnitario = cantidad > 0 ? (subtotal / cantidad).toFixed(2) : '0.00';
    
    const productData = [
      producto.descripcion || 'Producto sin nombre',
      cantidad,
      `$${precioUnitario}`,
      `$${subtotal.toFixed(2)}`
    ];
    tableRows.push(productData);
  });
} else {
  console.warn("La venta no tiene productos o no es un array:", venta.productos);
}

// Promociones
if (Array.isArray(venta.promociones)) {
  venta.promociones.forEach(promocion => {
    const cantidad = Number(promocion.cantidad) || 1;
    const subtotal = Number(promocion.subtotal) || 0;
    const precioUnitario = cantidad > 0 ? (subtotal / cantidad).toFixed(2) : '0.00';
    
    const promocionData = [
      ` ${promocion.nombre || promocion.descripcion || 'Promoción'}`,
      cantidad,
      `$${precioUnitario}`,
      `$${subtotal.toFixed(2)}`
    ];
    tableRows.push(promocionData);
  });
} else if (venta.promociones) {
  console.warn("Las promociones de la venta no son un array:", venta.promociones);
}
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: { 
        fillColor: [66, 133, 244], 
        textColor: [255, 255, 255],
        fontSize: 10
      },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      tableWidth: contentWidth,
      styles: { 
        fontSize: 9,
        cellPadding: 4, // Más padding en las celdas
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      }
    });
    
    y = doc.previousAutoTable.finalY + 15; // Más espacio después de la tabla
    
    // Totales
    doc.setFontSize(13); // Más grande para destacar
    doc.setFont(undefined, 'bold');
    const total = Number(venta.total) || 0;
    const totalText = `TOTAL: $${total.toFixed(2)}`;
    const totalWidth = doc.getStringUnitWidth(totalText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    doc.text(totalText, pageWidth - margin - totalWidth, y);
    y += 15; // Más espacio antes de la línea final
    
    // Línea divisoria final
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10; // Más espacio después de la línea
    
    // Mensaje final
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    y += centrarTexto("¡Gracias por su compra!", y) + 5;
    y += centrarTexto("Vuelva pronto", y) + 5;
    
    // Resolución para Promise
    resolve(doc);
  });
};

// Función para imprimir/descargar el ticket con nombre único
export const imprimirTicket = async (venta) => {
  try {
    // Validar que recibimos un objeto de venta
    if (!venta || typeof venta !== 'object') {
      console.error("Error al generar ticket: Venta inválida", venta);
      return false;
    }
    
    console.log("Generando ticket para venta:", venta._id);
    
    const doc = await generarTicketPDF(venta);
    
    // Generar un nombre de archivo único combinando:
    // - ID parcial de la venta
    // - fecha actual (año, mes, día)
    // - hora actual (hora, minuto, segundo, milisegundo)
    const ahora = new Date();
    const fecha = `${ahora.getFullYear()}${(ahora.getMonth()+1).toString().padStart(2, '0')}${ahora.getDate().toString().padStart(2, '0')}`;
    const hora = `${ahora.getHours().toString().padStart(2, '0')}${ahora.getMinutes().toString().padStart(2, '0')}${ahora.getSeconds().toString().padStart(2, '0')}${ahora.getMilliseconds().toString().padStart(3, '0')}`;
    const ventaId = venta._id ? venta._id.substring(0, 6) : 'SIN-ID';
    
    // Formato: ticket_ID-VENTA_AAAAMMDD_HHMMSSMMM.pdf
    const nombreArchivo = `ticket_${ventaId}_${fecha}_${hora}.pdf`;
    
    doc.save(nombreArchivo);
    console.log(`Ticket generado correctamente: ${nombreArchivo}`);
    return true;
  } catch (error) {
    console.error("Error al generar el ticket:", error);
    return false;
  }
};