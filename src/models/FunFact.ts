import mongoose, { Document, Schema } from 'mongoose';

export interface IFunFact extends Document {
  text: string;
}

const FunFactSchema: Schema = new Schema({
  text: { type: String, required: true },
});

export default mongoose.models.FunFact || mongoose.model<IFunFact>('FunFact', FunFactSchema);
