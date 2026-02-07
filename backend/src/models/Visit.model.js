import mongoose from 'mongoose';

const VISIT_STATUS = ['PLANNED', 'COMPLETED'];

const visitSchema = new mongoose.Schema(
  {
    family: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Family',
      required: true,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: {
        values: VISIT_STATUS,
        message: `Statut invalide. Valeurs: ${VISIT_STATUS.join(', ')}`,
      },
      default: 'COMPLETED',
    },
    types: {
      type: [String],
      default: [],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    proofPhoto: {
      type: String,
      trim: true,
      default: '',
    },
    checkInLocation: {
      lat: { type: Number },
      lng: { type: Number },
      accuracy: { type: Number },
      recordedAt: { type: Date },
    },
    assignedTo: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ],
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

visitSchema.index({ family: 1, date: -1 });

export default mongoose.model('Visit', visitSchema);
