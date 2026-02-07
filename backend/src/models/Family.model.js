import mongoose from 'mongoose';

const FAMILY_STATUS = ['ACTIVE', 'URGENT'];

const familySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom de la famille est requis'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: FAMILY_STATUS,
        message: `Statut invalide. Valeurs: ${FAMILY_STATUS.join(', ')}`,
      },
      default: 'ACTIVE',
    },
    needs: {
      type: [String],
      default: [],
      trim: true,
    },
    membersCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    familyHistory: {
      type: String,
      trim: true,
      default: '',
    },
    needsDetails: {
      type: {
        medications: { type: [String], default: [], trim: true },
        clothing: {
          type: [
            {
              type: { type: String, enum: ['Enfant', 'Adulte'] },
              gender: { type: String, enum: ['M', 'F'] },
              age: { type: Number, min: 0 },
              size: { type: String, trim: true, default: '' },
            },
          ],
          default: [],
        },
      },
      default: () => ({ medications: [], clothing: [] }),
    },
    coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Family', familySchema);
