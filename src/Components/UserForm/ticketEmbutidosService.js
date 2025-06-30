import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Función para generar un ticket de venta en PDF para embutidos
export const generarTicketEmbutidosPDF = async (venta, negocio = {
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
    
    console.log("Datos de venta recibidos para ticket:", JSON.stringify(venta, null, 2));
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Configuración de márgenes y tamaños
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    
    // Posición vertical actual
    let y = margin + 5;
    
    // Configuración de fuentes
    doc.setFontSize(12);
    
    // Función para centrar texto
    const centrarTexto = (texto, yPos) => {
      const textWidth = doc.getStringUnitWidth(texto) * doc.internal.getFontSize() / doc.internal.scaleFactor;
      const x = (pageWidth - textWidth) / 2;
      doc.text(texto, x, yPos);
      return doc.getTextDimensions(texto).h;
    };
    
    // Título del ticket
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    y += centrarTexto(negocio.nombre, y + 8) + 6;
    
    // Información del negocio
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    y += centrarTexto(negocio.direccion, y) + 4;
    y += centrarTexto(`Tel: ${negocio.telefono}`, y) + 4;
    y += centrarTexto(negocio.email, y) + 10;
    
    // Línea divisoria
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    
    // Información de la venta
    doc.setFontSize(12);
    const ticketNum = venta._id ? venta._id.substring(0, 8) : 'N/A';
    doc.text(`Ticket de Venta #${ticketNum}`, margin, y);
    y += 8;
    
    doc.setFontSize(10);
    const fechaFormateada = new Date(venta.fecha || new Date()).toLocaleString('es-AR', {
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
    y += 10;
    
    // Tabla de productos (embutido/cereal)
    const tableColumn = ["Producto", "Cant. (g)", "Precio/100g", "Subtotal"];
    const tableRows = [];
    
    // Preparar datos del producto con mejores cálculos
    let nombreProducto = 'Producto sin nombre';
    let cantidad = 0;
    let precioUnitario = 0;
    let subtotal = 0;
    
    // Mejora en la lógica de obtención de datos
    if (venta.embutido) {
      nombreProducto = venta.embutido.nombre;
      cantidad = Number(venta.cantidadGramos) || 0;
      precioUnitario = Number(venta.embutido.precioPorCienGramos) || 0;
      
      // Cálculo más preciso del subtotal
      subtotal = (cantidad * precioUnitario) / 100;
    } else if (venta.embutidoId) {
      nombreProducto = venta.embutidoId;
      cantidad = Number(venta.cantidadGramos) || 0;
      
      // Si no hay precio predefinido, calcular con valor de venta
      precioUnitario = venta.precioUnitario ? 
        Number(venta.precioUnitario) : 
        (venta.precioTotal / (cantidad / 100) || 0);
      
      subtotal = Number(venta.precioTotal) || 0;
    }
    
    // Preparar fila de producto con mejor precisión
    const productData = [
      nombreProducto,
      cantidad,
      `$${(precioUnitario).toFixed(2)}`, // Precio por 100g
      `$${subtotal.toFixed(2)}`
    ];
    tableRows.push(productData);
    
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
        cellPadding: 4,
        overflow: 'linebreak'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      }
    });
    
    y = doc.previousAutoTable.finalY + 15;
    
    // Totales
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    const total = Number(venta.precioTotal) || subtotal;
    const totalText = `TOTAL: $${total.toFixed(2)}`;
    const totalWidth = doc.getStringUnitWidth(totalText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    doc.text(totalText, pageWidth - margin - totalWidth, y);
    y += 15;
    
    // Línea divisoria final
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    // Mensaje final
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    y += centrarTexto("¡Gracias por su compra!", y) + 5;
    y += centrarTexto("Vuelva pronto", y) + 5;
    
    // Resolución para Promise
    resolve(doc);
  });
};

// Función para imprimir/descargar el ticket de embutidos con nombre único
export const imprimirTicketEmbutidos = async (venta) => {
  try {
    // Validar que recibimos un objeto de venta
    if (!venta || typeof venta !== 'object') {
      console.error("Error al generar ticket: Venta inválida", venta);
      return false;
    }
    
    console.log("Generando ticket para venta de embutido:", JSON.stringify(venta, null, 2));
    
    const doc = await generarTicketEmbutidosPDF(venta);
    
    // Generar un nombre de archivo único
    const ahora = new Date();
    const fecha = `${ahora.getFullYear()}${(ahora.getMonth()+1).toString().padStart(2, '0')}${ahora.getDate().toString().padStart(2, '0')}`;
    const hora = `${ahora.getHours().toString().padStart(2, '0')}${ahora.getMinutes().toString().padStart(2, '0')}${ahora.getSeconds().toString().padStart(2, '0')}${ahora.getMilliseconds().toString().padStart(3, '0')}`;
    const ventaId = venta._id ? venta._id.substring(0, 6) : 'SIN-ID';
    
    // Intentar obtener el nombre del embutido de diferentes formas
    let nombreEmbutido = 'PRODUCTO';
    if (venta.embutido && venta.embutido.nombre) {
      nombreEmbutido = venta.embutido.nombre.substring(0, 10).replace(/\s+/g, '-');
    } else if (venta.embutidoId) {
      nombreEmbutido = venta.embutidoId.substring(0, 10).replace(/\s+/g, '-');
    }
    
    // Formato: ticket_ID-VENTA_PRODUCTO_AAAAMMDD_HHMMSSMMM.pdf
    const nombreArchivo = `ticket_${ventaId}_${nombreEmbutido}_${fecha}_${hora}.pdf`;
    
    doc.save(nombreArchivo);
    console.log(`Ticket generado correctamente: ${nombreArchivo}`);
    return true;
  } catch (error) {
    console.error("Error al generar el ticket de embutidos:", error);
    return false;
  }
};