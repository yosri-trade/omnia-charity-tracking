/**
 * Script pour créer le premier utilisateur Admin.
 * Usage (depuis backend): node scripts/create-admin.js
 * Variables d'environnement: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 * Ou passées en ligne de commande: node scripts/create-admin.js email@example.com MotDePasse123 "Prénom Nom"
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.argv[2] || process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.argv[3] || process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.argv[4] || process.env.ADMIN_NAME || 'Administrateur';

async function main() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI manquant. Définissez-le dans .env ou en variable d\'environnement.');
    process.exit(1);
  }
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Usage: node scripts/create-admin.js <email> <mot_de_passe> [nom]');
    console.error('Ou définissez ADMIN_EMAIL, ADMIN_PASSWORD (et optionnellement ADMIN_NAME) dans .env');
    process.exit(1);
  }

  const User = (await import('../src/models/User.model.js')).default;

  await mongoose.connect(MONGODB_URI);
  const existing = await User.findOne({ email: ADMIN_EMAIL.trim().toLowerCase() });
  if (existing) {
    if (existing.role === 'ADMIN') {
      console.log('Un admin avec cet email existe déjà:', existing.email);
    } else {
      await User.findByIdAndUpdate(existing._id, { role: 'ADMIN' });
      console.log('Rôle mis à jour en ADMIN pour:', existing.email);
    }
  } else {
    await User.create({
      name: ADMIN_NAME.trim(),
      email: ADMIN_EMAIL.trim().toLowerCase(),
      password: ADMIN_PASSWORD,
      role: 'ADMIN',
    });
    console.log('Admin créé avec succès:', ADMIN_EMAIL);
  }
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
