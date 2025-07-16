import mongoose, { Schema, Document } from 'mongoose';

export interface IDesign extends Document {
  userId: string;
  prompt: string;
  imageUrl: string;
  isFavorite: boolean;
  createdAt: Date;
}

const DesignSchema: Schema = new Schema({
  userId: { type: String, required: true },
  prompt: { type: String, required: true },
  imageUrl: { type: String, required: true, unique: true },
  isFavorite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Design || mongoose.model<IDesign>('Design', DesignSchema);
