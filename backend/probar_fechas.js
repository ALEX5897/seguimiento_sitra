// Script para verificar si la función convertirFechaExcel tiene un error

function convertirFechaExcel(fechaExcel) {
  if (!fechaExcel) return null;
  
  if (fechaExcel instanceof Date) {
    return fechaExcel.toISOString().split('T')[0];
  }
  
  if (typeof fechaExcel === 'number') {
    const dias = Math.floor(fechaExcel);
    const fecha = new Date(Date.UTC(1899, 11, 30));
    fecha.setUTCDate(fecha.getUTCDate() + dias);
    return fecha.toISOString().split('T')[0];
  }
  
  if (typeof fechaExcel === 'string') {
    const fecha = new Date(fechaExcel);
    if (!isNaN(fecha.getTime())) {
      return fecha.toISOString().split('T')[0];
    }
  }
  
  return null;
}

console.log('🔍 PRUEBA DE CONVERSIÓN DE FECHAS\n');

// Casos de prueba
const fechasExcel = [46101, 46183, 46054];
const fechasEsperadas = ['2026-03-20', '2026-06-10', '2026-02-01'];
const fechasNombres = ['Marzo 20', 'Junio 10', 'Febrero 1'];

fechasExcel.forEach((serial, i) => {
  const resultado = convertirFechaExcel(serial);
  const esperada = fechasEsperadas[i];
  const match = resultado === esperada ? '✅' : '❌';
  
  console.log(`${match} Serial ${serial} (${fechasNombres[i]})`);
  console.log(`   Esperada: ${esperada}`);
  console.log(`   Obtenida: ${resultado}`);
  console.log();
});

// Prueba manual del cálculo
console.log('📊 VERIFICACIÓN MANUAL DEL CÁLCULO\n');

const serial = 46101; // Debe ser 2026-03-20
console.log(`Serial de Excel: ${serial}`);

// Método actual
const dias = Math.floor(serial);
const fecha = new Date(Date.UTC(1899, 11, 30));
console.log(`Fecha base (1899-12-30): ${fecha.toISOString()}`);

fecha.setUTCDate(fecha.getUTCDate() + dias);
console.log(`Después de sumar ${dias} días: ${fecha.toISOString()}`);
console.log(`Resultado final: ${fecha.toISOString().split('T')[0]}`);

// Verificación inversa: ¿cuántos días desde 1899-12-30 hasta 2026-03-20?
console.log(`\n📐 VERIFICACIÓN INVERSA`);
const target = new Date(Date.UTC(2026, 2, 20)); // 2026-03-20
const base = new Date(Date.UTC(1899, 11, 30));
const diffMs = target.getTime() - base.getTime();
const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
console.log(`Días desde 1899-12-30 hasta 2026-03-20: ${diffDays}`);
console.log(`Valor en Excel: 46101`);
console.log(`Diferencia: ${46101 - diffDays} día(s)`);
