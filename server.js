import express from 'express';
import dotenv from 'dotenv';
import conectarDB from './config/db.js';
import authRoutes from './routes/auth.js';
import egresadoRoutes from './routes/egresado.routes.js';
import publicacionRoutes from './routes/publicacion.route.js';
import administradorRoutes from './routes/administrador.routes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

dotenv.config();
conectarDB();

const app = express();

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

// app.use(mongoSanitize());

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/usuario', authRoutes);
app.use('/api/egresado', egresadoRoutes);
app.use('/api/publicacion', publicacionRoutes);
app.use('/api/admin', administradorRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});