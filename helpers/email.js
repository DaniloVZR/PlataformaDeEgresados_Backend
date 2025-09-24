import nodemailer from "nodemailer";

export const emailRegistro = async (datos) => {
  const { email, nombre, asunto, mensaje, token } = datos;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
    });

    await transporter.sendMail({
      from: '"Plataforma de Egresados" <${process.env.EMAIL_USER}>',
      to: email,
      subject: asunto,
      text: mensaje,
      html: `
        <p>Hola ${nombre},</p>
        <p>Tu cuenta ya casi está lista, por favor confirma tu correo haciendo clic en el siguiente botón:</p>
        <a href="http://localhost:5000/api/usuario/confirmar/${token}" 
          style="display: inline-block; padding: 10px 20px; font-size: 16px; 
                  color: white; background-color: #4CAF50; text-decoration: none; 
                  border-radius: 5px;">
          Confirmar cuenta
        </a>
        <p>Si no fuiste tú, puedes ignorar este mensaje.</p>
        <p>Saludos,<br>El equipo de la Plataforma de Egresados</p>
      `
    });

    console.log('Correo de registro enviado a: ' + email);
  } catch (error) {
    console.log('Error al enviar el correo de registro: ', error);
  }
}

export const emailOlvidePassword = async ({ nombre, email, token }) => {

  console.log(email);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
    });

    const url = `${process.env.BACKEND_URL}/api/usuarios/olvide-password/${token}`;

    const info = await transporter.sendMail({
      from: `"Plataforma de Egresados" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Restablece tu contraseña en Plataforma de Egresados",
      text: `Hola ${nombre}, restablece tu contraseña en el siguiente enlace: ${url}`,
      html: `
        <p>Hola ${nombre},</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para generar una nueva:</p>
        <a href="${url}" 
           style="display: inline-block; padding: 10px 20px; font-size: 16px; 
                  color: white; background-color: #2196F3; text-decoration: none; 
                  border-radius: 5px;">
          Restablecer contraseña
        </a>
        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
        <p>Saludos,<br>El equipo de la Plataforma de Egresados</p>
      `
    });

    console.log("Correo enviado: %s", info.messageId);
  } catch (error) {
    console.error("Error al enviar correo de restablecer contraseña:", error);
  }
};
