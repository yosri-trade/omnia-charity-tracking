import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLES = ['VOLUNTEER', 'COORDINATOR', 'ADMIN'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    },
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ROLES,
        message: `Rôle invalide. Valeurs acceptées: ${ROLES.join(', ')}`,
      },
      default: 'VOLUNTEER',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: false,
      transform(_doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode pour comparer le mot de passe (pour login)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserRoles = Object.freeze(ROLES.reduce((acc, r) => ({ ...acc, [r]: r }), {}));
export default mongoose.model('User', userSchema);
