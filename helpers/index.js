import jwt from 'jsonwebtoken';

export const generarJWT = (usuario) => {
  return jwt.sign(
    { id: usuario._id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const generarId = () => {
  const random = Math.random().toString(32).substring(2);
  const fecha = Date.now().toString(32);
  return random + fecha;
};