const fff = "2025-06-11T09:16:00.151-06:00";

function main(fechaOriginal) {

    const indiceZonaHoraria = fechaOriginal.lastIndexOf('+') > -1
        ? fechaOriginal.lastIndexOf('+')
        : fechaOriginal.lastIndexOf('-');

    let fechaFormateada;

    if (indiceZonaHoraria > -1) {
        // Si hay una zona horaria, toma la subcadena hasta antes de ella
        fechaFormateada = fechaOriginal.substring(0, indiceZonaHoraria);
    } else {
        // Si no hay zona horaria (poco probable con el formato TZO), usa la cadena completa
        fechaFormateada = fechaOriginal;
    }

    // Reemplaza la 'T' con un espacio
    fechaFormateada = fechaFormateada.replace('T', ' ');

    console.log("Fecha original:", fechaOriginal);
    console.log("Fecha formateada (Opción 1):", fechaFormateada);

}

function main2(fechaOriginal){
    
}

main(fff);
