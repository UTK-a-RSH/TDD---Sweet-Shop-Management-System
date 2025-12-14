import mongoose, { Schema, Document, Model } from 'mongoose';

// TypeScript interface for User
export interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Interface for User document (includes Mongoose document properties)
export interface IUserDocument extends IUser, Document {}

// Interface for User model (for static methods if needed)
export interface IUserModel extends Model<IUserDocument> {}

// Mongoose Schema
const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);



const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
