import mongoose, { Document, Schema, Types } from 'mongoose';
import { Role, ROLES } from '../../config/constants';

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  avatar: string;
  role: Role;
  solvedProblems: Types.ObjectId[];
  totalSolved: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    avatar: { type: String, default: '' },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    solvedProblems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
    totalSolved: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
