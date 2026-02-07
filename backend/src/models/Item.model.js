import mongoose from 'mongoose';

const ITEM_CATEGORIES = ['Alimentaire', 'Médical', 'Vêtements', 'Hygiène', 'Scolaire', 'Autre'];

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Le nom de l'article est requis"],
      trim: true,
    },
    category: {
      type: String,
      enum: {
        values: ITEM_CATEGORIES,
        message: `Catégorie invalide. Valeurs: ${ITEM_CATEGORIES.join(', ')}`,
      },
      required: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: 'pièces',
    },
    minThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Item', itemSchema);
