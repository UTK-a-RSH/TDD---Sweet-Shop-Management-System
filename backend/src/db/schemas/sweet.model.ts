import mongoose, { Schema, Document, Model } from 'mongoose';

// TypeScript interface for Sweet
export interface ISweet {
  name: string;
  category: string;
  price: number;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Sweet document (includes Mongoose document properties)
export interface ISweetDocument extends ISweet, Document {}

// Interface for Sweet model (for static methods if needed)
export interface ISweetModel extends Model<ISweetDocument> {}

// Mongoose Schema
const sweetSchema = new Schema<ISweetDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster searches
sweetSchema.index({ name: 'text', category: 'text' });
sweetSchema.index({ price: 1 });

const Sweet = mongoose.model<ISweetDocument, ISweetModel>('Sweet', sweetSchema);

export default Sweet;
