import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from '../models/Usuario.js';

dotenv.config();

/**
 * Script de migración para agregar campos 'rol' y 'activo' a usuarios existentes
 * 
 * Ejecutar con: node migracionRoles.js
 */

const migrarUsuarios = async () => {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a la base de datos');

    // Actualizar todos los usuarios sin el campo 'rol'
    const resultRol = await Usuario.updateMany(
      { rol: { $exists: false } },
      {
        $set: {
          rol: 'comun',
          activo: true
        }
      }
    );

    console.log(`✅ ${resultRol.modifiedCount} usuarios actualizados con rol 'comun'`);

    // Actualizar usuarios que no tienen el campo 'activo'
    const resultActivo = await Usuario.updateMany(
      { activo: { $exists: false } },
      { $set: { activo: true } }
    );

    console.log(`✅ ${resultActivo.modifiedCount} usuarios actualizados con estado 'activo'`);

    // Mostrar estadísticas
    const totalUsuarios = await Usuario.countDocuments();
    const administradores = await Usuario.countDocuments({ rol: 'administrador' });
    const comunes = await Usuario.countDocuments({ rol: 'comun' });

    console.log('\n📊 Estadísticas:');
    console.log(`   Total de usuarios: ${totalUsuarios}`);
    console.log(`   Administradores: ${administradores}`);
    console.log(`   Usuarios comunes: ${comunes}`);

    // Si no hay administradores, sugerir crear uno
    if (administradores === 0) {
      console.log('\n⚠️  IMPORTANTE: No hay administradores en el sistema.');
      console.log('   Para crear un administrador, ejecuta:');
      console.log('   1. Registra un usuario normalmente');
      console.log('   2. En la base de datos, actualiza su rol a "administrador"');
      console.log('   3. O usa MongoDB Compass/CLI con:');
      console.log('      db.usuarios.updateOne({ correo: "tu@correo.com" }, { $set: { rol: "administrador" } })');
    }

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
};

// Ejecutar migración
migrarUsuarios();