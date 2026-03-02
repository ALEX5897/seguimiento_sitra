import ExcelJS from 'exceljs';

export async function exportToExcel(options = {}) {
  try {
    const {
      filename = 'reporte.xlsx',
      sheetName = 'Datos',
      title = '',
      columns = [],
      rows = [],
      stats = []
    } = options;

    console.log('📊 exportToExcel recibió:', { 
      filename, 
      sheetName, 
      title, 
      columnCount: columns.length, 
      rowCount: rows.length, 
      statsCount: stats.length 
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // NO configurar worksheet.columns aquí porque ocupamos agregar manualmente
    // Solo configurar ancho
    const columnCount = columns.length;
    for (let i = 1; i <= columnCount; i++) {
      worksheet.getColumn(i).width = 18;
    }

    console.log('✅ Ancho de columnas configurado:', columns.length);

    // Iniciar con el título si existe
    let currentRow = 1;
    
    if (title) {
      const titleRow = worksheet.addRow([title]);
      titleRow.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
      titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      titleRow.alignment = { horizontal: 'center', vertical: 'center' };
      
      // Mergear celdas del título
      if (columns.length > 1) {
        worksheet.mergeCells(`A${currentRow}:${String.fromCharCode(64 + columns.length)}${currentRow}`);
      }
      
      currentRow++;
      
      // Agregar fila vacía
      worksheet.addRow([]);
      currentRow++;
    }

    // Agregar encabezados de columnas
    const headerRow = worksheet.addRow(columns);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5B9BD5' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'center' };
    
    console.log('✅ Encabezados agregados en fila:', currentRow);

    // Agregar filas de datos
    const startDataRow = currentRow + 1;
    if (rows && rows.length > 0) {
      rows.forEach((rowData, index) => {
        const newRow = worksheet.addRow(rowData);
        newRow.alignment = { horizontal: 'left', vertical: 'center' };
        
        // Alternar colores
        if ((startDataRow + index) % 2 === 0) {
          newRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        }
      });
      console.log('✅ Datos agregados:', rows.length, 'filas');
    } else {
      console.warn('⚠️ No hay datos para agregar');
    }

    // Agregar estadísticas si existen
    if (stats && stats.length > 0) {
      worksheet.addRow([]); // Espacio en blanco

      stats.forEach(stat => {
        const row = worksheet.addRow([stat.label, stat.value]);
        row.getCell(1).font = { bold: true };
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE699' } };
      });
      console.log('✅ Estadísticas agregadas:', stats.length, 'elementos');
    }

    // Generar y descargar
    console.log('📝 Generando archivo Excel...');
    const buffer = await workbook.xlsx.writeBuffer();
    console.log('📝 Buffer generado, tamaño:', buffer.byteLength, 'bytes');
    
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    console.log('📝 Iniciando descarga:', filename);
    link.click();
    
    // Limpiar después de descargar
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    console.log('✓ Archivo descargado:', filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    console.error('Stack:', error.stack);
    alert('Error al descargar el archivo Excel: ' + error.message);
    throw error;
  }
}

export async function exportToCSV(data, options = {}) {
  try {
    const {
      filename = 'reporte.csv',
      columns = [],
      rows = [],
      stats = []
    } = options;

    let csv = columns && columns.length > 0 
      ? columns.join(',') + '\n'
      : 'Datos exportados\n';

    if (rows && rows.length > 0) {
      rows.forEach(row => {
        csv += row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',') + '\n';
      });
    }

    if (stats && stats.length > 0) {
      csv += '\nEstadísticas\n';
      stats.forEach(stat => {
        csv += `"${stat.label}","${stat.value}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    console.log('✓ CSV descargado:', filename);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    alert('Error al descargar el CSV: ' + error.message);
  }
}
