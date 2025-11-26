# 🎓 Plataforma de Egresados - Backend

API RESTful y servidor WebSocket para la red social de egresados de la Institución Universitaria Pascual Bravo.

## 🚀 Características

- **Autenticación JWT** con tokens seguros
- **Mensajería en tiempo real** con Socket.IO
- **Gestión de perfiles** de egresados
- **Sistema de publicaciones** con likes y comentarios
- **Panel de administración** para moderación
- **Subida de imágenes** a Cloudinary
- **Notificaciones por email** con SendGrid

## 🛠️ Tecnologías

- **Node.js** (v18+) - Runtime JavaScript
- **Express** (v5) - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **Socket.IO** - WebSockets bidireccionales
- **JWT** - Autenticación stateless
- **Bcrypt** - Encriptación de contraseñas
- **Cloudinary** - Almacenamiento de imágenes
- **SendGrid** - Envío de emails

## 📦 Instalación

```bash
# Clonar repositorio
git clone <repository-url>
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar servidor de desarrollo
npm run dev
```

## 🔐 Variables de Entorno

```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/egresados

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# SendGrid
SENDGRID_API_KEY=tu_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@tudominio.com

# Frontend
FRONTEND_URL=http://localhost:5173

# Servidor
PORT=5000
NODE_ENV=development
```

## 📁 Estructura del Proyecto

```
backend/
├── config/          # Configuración (DB, Cloudinary)
├── controllers/     # Lógica de negocio
├── middleware/      # Middlewares (auth, validación, sanitización)
├── models/          # Esquemas de Mongoose
├── routes/          # Definición de endpoints
├── socket/          # Manejo de WebSockets
├── helpers/         # Funciones auxiliares
├── scripts/         # Scripts de migración
└── server.js        # Punto de entrada
```

## 🔗 Endpoints Principales

### Autenticación

```
POST   /api/usuario/registrar          # Registro de usuario
POST   /api/usuario/autenticar         # Login
POST   /api/usuario/recuperar-password # Recuperar contraseña
GET    /api/usuario/confirmar/:token   # Confirmar cuenta
GET    /api/usuario/perfil             # Obtener perfil autenticado
POST   /api/usuario/logout             # Cerrar sesión
```

### Egresados

```
GET    /api/egresado                   # Obtener mi perfil
PUT    /api/egresado                   # Actualizar perfil
PUT    /api/egresado/foto              # Actualizar foto
GET    /api/egresado/buscar            # Buscar egresados
GET    /api/egresado/:id               # Perfil público
```

### Publicaciones

```
POST   /api/publicacion                # Crear publicación
GET    /api/publicacion                # Listar publicaciones
GET    /api/publicacion/:id            # Ver publicación
POST   /api/publicacion/:id/like       # Dar/quitar like
DELETE /api/publicacion/:id            # Eliminar publicación
```

### Comentarios

```
POST   /api/comentario/:publicacionId  # Crear comentario
GET    /api/comentario/:publicacionId  # Listar comentarios
DELETE /api/comentario/:comentarioId   # Eliminar comentario
```

### Mensajes (requiere Socket.IO)

```
POST   /api/mensaje                    # Enviar mensaje
GET    /api/mensaje/conversaciones     # Listar conversaciones
GET    /api/mensaje/:usuarioId         # Ver conversación
PUT    /api/mensaje/:usuarioId/leido   # Marcar como leído
```

### Admin (solo rol administrador)

```
GET    /api/admin/metricas             # Métricas del sistema
GET    /api/admin/usuarios             # Listar usuarios
PUT    /api/admin/usuarios/:id/rol     # Cambiar rol
PUT    /api/admin/usuarios/:id/ban     # Suspender/reactivar
DELETE /api/admin/publicaciones/:id    # Eliminar publicación
```

## 🔒 Seguridad

### Autenticación

- JWT con expiración de 30 días
- Contraseñas hasheadas con bcrypt (10 rounds)
- Middleware `checkAuth` en rutas protegidas
- Validación de correo institucional (@pascualbravo.edu.co)

### Prevención de Ataques

- **NoSQL Injection:** Middleware `safeSanitize` bloquea operadores MongoDB
- **XSS:** Sanitización de inputs con express-validator
- **CORS:** Configuración restrictiva de orígenes permitidos
- **Rate Limiting:** (Deshabilitado en dev, activar en producción)

### WebSockets

- Autenticación por token JWT en handshake
- Validación de usuario en cada conexión
- Rooms por usuario para mensajes privados

## 🧪 Testing

```bash
# Ejecutar tests (configurar primero)
npm test

# Verificar conectividad de DB
node -e "require('./config/db')"
```

## 🚀 Despliegue (Render)

El archivo `render.yaml` configura automáticamente:

- Variables de entorno
- Health checks
- Headers para WebSockets
- Auto-deploy desde GitHub

```yaml
services:
  - type: web
    name: plataformadeegresados-backend
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
```

## 📝 Modelos de Datos

### Usuario

```javascript
{
  nombre: String,
  correo: String (único, @pascualbravo.edu.co),
  password: String (hasheado),
  token: String,
  confirmado: Boolean,
  rol: String (enum: ['comun', 'administrador']),
  activo: Boolean
}
```

### Egresado

```javascript
{
  usuario: ObjectId (ref: Usuario),
  nombre: String,
  apellido: String,
  email: String,
  descripcion: String,
  programaAcademico: String,
  yearGraduacion: Number,
  redesSociales: {
    linkedin: String,
    github: String,
    twitter: String,
    instagram: String
  },
  fotoPerfil: String (URL Cloudinary),
  completadoPerfil: Boolean
}
```

### Publicación

```javascript
{
  autor: ObjectId (ref: Egresado),
  descripcion: String,
  imagen: String (URL Cloudinary),
  likes: [ObjectId] (ref: Egresado),
  createdAt: Date,
  updatedAt: Date
}
```

## 📄 Licencia

Este proyecto es privado y de uso exclusivo de la Institución Universitaria Pascual Bravo.
