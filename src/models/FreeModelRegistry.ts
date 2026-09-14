import mongoose, { Document, Schema } from 'mongoose';

export interface IFreeModelRegistry extends Document {
  key: string;
  models: string[];
  lastCheckedDay: string; // UTC calendar day, e.g. "2025-08-18"
}

const FreeModelRegistrySchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  models: { type: [String], required: true },
  lastCheckedDay: { type: String, required: true },
});

export default (
  mongoose.models.FreeModelRegistry ||
  mongoose.model<IFreeModelRegistry>('FreeModelRegistry', FreeModelRegistrySchema)
);