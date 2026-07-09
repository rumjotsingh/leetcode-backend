import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPlaylist extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  isOfficial: boolean;
  isPublic: boolean;
  createdBy: Types.ObjectId | null;
  problems: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const playlistSchema = new Schema<IPlaylist>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    isOfficial: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    problems: [{ type: Schema.Types.ObjectId, ref: 'Problem' }],
  },
  { timestamps: true }
);

playlistSchema.index({ isOfficial: 1, createdAt: -1 });
playlistSchema.index({ createdBy: 1 });

export const Playlist = mongoose.model<IPlaylist>('Playlist', playlistSchema);
