import express from 'express';
import dotenv from 'dotenv';
import conectarDB from './config/db.js';
import authRoutes from './routes/auth.js';
import egresadoRoutes from './routes/egresado.routes.js';
import publicacionRoutes from './routes/publicacion.route.js';
import administradorRoutes from './routes/administrador.routes.js';
import comentarioRoutes from './routes/comentario.routes.js';
import mensajeRoutes from './routes/mensaje.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { configurarSocket } from './socket/socketHandler.js';
// import mongoSanitize from 'express-mongo-sanitize';

dotenv.config();
conectarDB();

const app = express();

const httpServer = createServer(app);

app.use(cookieParser());

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173'
].filter(Boolean);

// Actualiza CORS para permitir credentials
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// app.use(mongoSanitize({
//   replaceWith: '_',
//   onSanitize: ({ req, key }) => {
//     console.warn(`Se ha detectado y limpiado un intento de inyección en el campo: ${key}`);
//   }
// }));

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8,
  // Permitir upgrade de polling a websocket
  allowUpgrades: true,
  // Path específico
  path: '/socket.io/',
  // Configuración adicional para proxy
  serveClient: false,
  cookie: false
});

configurarSocket(io);
app.set('io', io);

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/usuario', authRoutes);
app.use('/api/egresado', egresadoRoutes);
app.use('/api/publicacion', publicacionRoutes);
app.use('/api/comentario', comentarioRoutes);
app.use('/api/mensaje', mensajeRoutes);
app.use('/api/admin', administradorRoutes);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready for connections`);
});