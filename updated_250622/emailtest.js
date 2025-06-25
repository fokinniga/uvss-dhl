const nodemailer = require("nodemailer");

async function sendTestEmail() {
  // --- Configura tu transporter ---
  // Asegúrate de usar tu correo y la contraseña de aplicación de Google AQUÍ.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tu.correo.electronico@gmail.com", // ¡Tu dirección de correo!
      pass: "tucontraseñadeaplicacion", // ¡Tu contraseña de aplicación de 16 caracteres, sin espacios!
    },
  });

  // --- Opciones del correo ---
  const mailOptions = {
    from: "tu.correo.electronico@gmail.com", // Debe ser el mismo que el 'user' de arriba
    to: "correo.destino@example.com", // Cambia esto por un correo donde puedas verificar la recepción
    subject: "Correo de Prueba de Nodemailer - " + new Date().toLocaleString(),
    text: "¡Hola! Este es un correo de prueba enviado desde Node.js con Nodemailer.",
    html: "<b>¡Hola!</b> Este es un correo de prueba enviado desde Node.js con <i>Nodemailer</i>. <br><br>Si lo recibes, ¡tu configuración funciona!",
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado con éxito:");
    console.log("ID del mensaje:", info.messageId);
    console.log("URL de vista previa (si aplica):", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error al enviar el correo de prueba:");
    console.error(error);
    // Errores comunes aquí son problemas de autenticación o de red.
    // Si ves "Username and Password not accepted", revisa tu contraseña de aplicación.
  }
}

sendTestEmail();