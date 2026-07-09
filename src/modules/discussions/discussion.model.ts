import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDiscussion extends Document {
  _id: Types.ObjectId;
  problemId: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  content: string;
  upvotes: Types.ObjectId[];
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDiscussionReply extends Document {
  _id: Types.ObjectId;
  discussionId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  upvotes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const discussionSchema = new Schema<IDiscussion>(
  {
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 10000 },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replyCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const discussionReplySchema = new Schema<IDiscussionReply>(
  {
    discussionId: { type: Schema.Types.ObjectId, ref: 'Discussion', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 5000 },
    upvotes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

discussionSchema.index({ problemId: 1, createdAt: -1 });

export const Discussion = mongoose.model<IDiscussion>('Discussion', discussionSchema);
export const DiscussionReply = mongoose.model<IDiscussionReply>('DiscussionReply', discussionReplySchema);
