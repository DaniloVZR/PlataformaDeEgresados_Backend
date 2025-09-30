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

    const url = `${process.env.FRONTEND_URL}/confirmar-cuenta/${token}`;

    await transporter.sendMail({
      from: `"Plataforma de Egresados" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: asunto,
      text: `Hola ${nombre},\n\nTu cuenta ya casi está lista, por favor confirma tu correo haciendo clic en el siguiente enlace: ${url}\n\nSi no fuiste tú, puedes ignorar este mensaje.\n\nSaludos,\nEl equipo de la Plataforma de Egresados`,
      html: `
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9ff;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 0.5rem; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #5f41e4, #462cbb); padding: 2rem; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 1.5rem; font-weight: 600;">Plataforma de Egresados</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0.5rem 0 0 0; font-size: 1.1rem;">Confirmación de Cuenta</p>
        </div>

        <!-- Content -->
        <div style="padding: 2rem 1.5rem;">
            <p style="font-size: 1.06rem; color: #333; margin-bottom: 1.5rem;">Hola <strong>${nombre}</strong>,</p>
            
            <p style="font-size: 1.06rem; color: #555; line-height: 1.6; margin-bottom: 1.5rem;">
                Tu cuenta ya casi está lista, por favor confirma tu correo haciendo clic en el siguiente botón:
            </p>

            <!-- Button -->
            <div style="text-align: center; margin: 2rem 0;">
                <a href="${url}" 
                   style="display: inline-block; padding: 15px 30px; 
                          font-size: 1.06rem; font-weight: 600; 
                          color: white; background-color: #4CAF50; 
                          text-decoration: none; border-radius: 0.30rem;
                          transition: background-color 0.3s ease;
                          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);">
                    Confirmar Cuenta
                </a>
            </div>            

            <div style="background-color: #e8f5e9; border: 1px solid #c8e6c9; 
                       border-radius: 0.31rem; padding: 1rem; margin: 1.5rem 0;">
                <p style="font-size: 0.87rem; color: #2e7d32; margin: 0; line-height: 1.5;">
                    ✅ <strong>Importante:</strong> Esta confirmación es necesaria para activar tu cuenta y acceder a todos los beneficios de la plataforma.
                </p>
            </div>

            <p style="font-size: 1rem; color: #555; line-height: 1.6; margin-bottom: 0;">
                Saludos cordiales,<br>
                <strong>El equipo de la Plataforma de Egresados</strong>
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9ff; padding: 1.5rem; text-align: center; border-top: 1px solid #d5cbff;">
            <p style="font-size: 0.87rem; color: #8c8c8c; margin: 0;">
                © ${new Date().getFullYear()} Plataforma de Egresados. Todos los derechos reservados.
            </p>
            <p style="font-size: 0.8rem; color: #bfb3f2; margin: 0.5rem 0 0 0;">
                Este es un mensaje automático, por favor no respondas a este correo.
            </p>
        </div>
    </div>
</body>
  `
    });

  } catch (error) {
    console.log('Error al enviar el correo de registro: ', error);
  }
}

export const emailOlvidePassword = async ({ nombre, email, token }) => {

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

    const url = `${process.env.FRONTEND_URL}/cambiar-contraseña/${token}`;

    const info = await transporter.sendMail({
      from: `"Plataforma de Egresados" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Restablece tu contraseña en Plataforma de Egresados",
      text: `Hola ${nombre}, restablece tu contraseña en el siguiente enlace: ${url}`,
      html: `
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9ff;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 0.5rem; box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #5f41e4, #462cbb); padding: 2rem; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 1.5rem; font-weight: 600;">Plataforma de Egresados</h1>
            <p style="color: rgba(255, 255, 255, 0.9); margin: 0.5rem 0 0 0; font-size: 1.1rem;">Restablecimiento de Contraseña</p>
        </div>

        <!-- Content -->
        <div style="padding: 2rem 1.5rem;">
            <p style="font-size: 1.06rem; color: #333; margin-bottom: 1.5rem;">Hola <strong>${nombre}</strong>,</p>
            
            <p style="font-size: 1.06rem; color: #555; line-height: 1.6; margin-bottom: 1.5rem;">
                Has solicitado restablecer tu contraseña. Haz clic en el siguiente botón para generar una nueva contraseña:
            </p>

            <!-- Button -->
            <div style="text-align: center; margin: 2rem 0;">
                <a href="${url}" 
                   style="display: inline-block; padding: 15px 30px; 
                          font-size: 1.06rem; font-weight: 600; 
                          color: white; background-color: #5f41e4; 
                          text-decoration: none; border-radius: 0.30rem;
                          transition: background-color 0.3s ease;
                          box-shadow: 0 4px 12px rgba(95, 65, 228, 0.3);">
                    Restablecer Contraseña
                </a>
            </div>           

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; 
                       border-radius: 0.31rem; padding: 1rem; margin: 1.5rem 0;">
                <p style="font-size: 0.87rem; color: #856404; margin: 0; line-height: 1.5;">                    
                    Si no solicitaste este cambio, ignora este mensaje.
                </p>
            </div>

            <p style="font-size: 1rem; color: #555; line-height: 1.6; margin-bottom: 0;">
                Saludos cordiales,<br>
                <strong>El equipo de la Plataforma de Egresados</strong>
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9ff; padding: 1.5rem; text-align: center; border-top: 1px solid #d5cbff;">
            <p style="font-size: 0.87rem; color: #8c8c8c; margin: 0;">
                © ${new Date().getFullYear()} Plataforma de Egresados. Todos los derechos reservados.
            </p>
            <p style="font-size: 0.8rem; color: #bfb3f2; margin: 0.5rem 0 0 0;">
                Este es un mensaje automático, por favor no respondas a este correo.
            </p>
        </div>
    </div>
</body>
      `
    });

    console.log("Correo enviado: %s", info.messageId);
  } catch (error) {
    console.error("Error al enviar correo de restablecer contraseña:", error);
  }
};
