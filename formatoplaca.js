function formatNumberWithTemplate(number, templateName) {
    console.log(`Input: number="${number}", templateName="${templateName}"`);

    // Extraer la parte del formato del template (ej. "2L-2D-3D")
    const formatoPuro = templateName.split('_')[1]; // Tomará "2L-2D-3D"

    if (!formatoPuro) {
        console.warn("Template name no contiene un formato válido después del '_'. Retornando el número original.");
        return number;
    }

    // Parsear el formato para obtener las longitudes y tipos
    // Esto resultará en algo como: [{tipo: 'L', longitud: 2}, {tipo: 'D', longitud: 2}, {tipo: 'D', longitud: 3}]
    const partesFormato = formatoPuro.split('-').map(parte => {
        const longitud = parseInt(parte.slice(0, -1), 10);
        const tipo = parte.slice(-1); // 'L' para letra, 'D' para dígito
        return { tipo, longitud };
    });

    let formattedNumber = '';
    let currentNumberIndex = 0;

    for (let i = 0; i < partesFormato.length; i++) {
        const parte = partesFormato[i];
        const longitudDeseada = parte.longitud;

        // Extraer la subcadena del número original
        const subcadena = number.substring(currentNumberIndex, currentNumberIndex + longitudDeseada);

        // Añadir la subcadena al resultado
        formattedNumber += subcadena;

        // Si no es la última parte, añadir un guion
        if (i < partesFormato.length - 1) {
            formattedNumber += '-';
        }

        // Mover el índice para la próxima parte
        currentNumberIndex += longitudDeseada;
    }

    console.log(`Output: ${formattedNumber}`);
    return formattedNumber;
}

// --- Pruebas ---
const numeroOriginal1 = "LF90950";
const template1 = "MEX_2L-2D-3D";
const resultado1 = formatNumberWithTemplate(numeroOriginal1, template1);
// Esperado: "LF-90-950"
console.log(`Resultado para "${numeroOriginal1}" y "${template1}": ${resultado1}\n`);

const numeroOriginal2 = "ABC1234";
const template2 = "USA_3L-4D"; // Nuevo template de ejemplo
const resultado2 = formatNumberWithTemplate(numeroOriginal2, template2);
// Esperado: "ABC-1234"
console.log(`Resultado para "${numeroOriginal2}" y "${template2}": ${resultado2}\n`);

const numeroOriginal3 = "XYZ987654";
const template3 = "CAN_3L-2D-4D"; // Otro template de ejemplo
const resultado3 = formatNumberWithTemplate(numeroOriginal3, template3);
// Esperado: "XYZ-98-7654"
console.log(`Resultado para "${numeroOriginal3}" y "${template3}": ${resultado3}\n`);

// Caso donde el número es más corto de lo esperado
const numeroOriginal4 = "AB1";
const template4 = "GER_2L-2D-3D"; // Espera "AB-1_-___" pero la función lo corta hasta donde da el numero
const resultado4 = formatNumberWithTemplate(numeroOriginal4, template4);
// Esperado: "AB-1" (Porque '1' es el primer dígito, y no hay mas para el segundo dígito y las 3D)
console.log(`Resultado para "${numeroOriginal4}" y "${template4}": ${resultado4}\n`);

// Caso donde el número es más largo de lo esperado
const numeroOriginal5 = "ABCD12345678";
const template5 = "JPN_4L-2D-3D";
const resultado5 = formatNumberWithTemplate(numeroOriginal5, template5);
// Esperado: "ABCD-12-345" (porque el resto se ignora)
console.log(`Resultado para "${numeroOriginal5}" y "${template5}": ${resultado5}\n`);