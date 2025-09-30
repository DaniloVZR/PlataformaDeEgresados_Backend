import express from 'express';
import dotenv from 'dotenv';
import conectarDB from './config/db.js';
import authRoutes from './routes/auth.js';
import mongoSanitize from 'express-mongo-sanitize';
import cors from 'cors';

dotenv.config();
conectarDB();

const app = express();
app.use(cors());
app.use(express.json());

// app.use(mongoSanitize());

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/usuario', authRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});