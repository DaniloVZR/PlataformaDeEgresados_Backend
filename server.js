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

dotenv.config();
conectarDB();

const app = express();

const httpServer = createServer(app);

app.use(cookieParser());

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173'
];

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
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(httpServer, {
  cors: corsOptions
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready for connections`);
});