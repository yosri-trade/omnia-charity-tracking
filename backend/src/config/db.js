import mongoose from 'mongoose';

/**
 * Connexion à MongoDB via Mongoose.
 * Utilise MONGODB_URI depuis les variables d'environnement.
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error.message);
    process.exit(1);
  }
};
