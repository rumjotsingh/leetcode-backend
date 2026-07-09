import { Types } from 'mongoose';
import { Discussion, DiscussionReply } from './discussion.model';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { getPagination } from '../../utils/response';
import { findProblemByIdOrSlug } from '../../utils/problemLookup';
import {
  DiscussionListQuery,
  CreateDiscussionInput,
  CreateReplyInput,
  UpdateDiscussionInput,
} from './discussion.schema';

function formatAuthor(user: { username: string; avatar: string } | null) {
  return user ? { username: user.username, avatar: user.avatar } : null;
}

export class DiscussionService {
  async listByProblem(problemSlug: string, query: DiscussionListQuery) {
    const problem = await findProblemByIdOrSlug(problemSlug);
    if (!problem) throw new NotFoundError('Problem not found');

    const filter = { problemId: problem._id };
    const skip = (query.page - 1) * query.limit;

    const [discussions, total] = await Promise.all([
      Discussion.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .populate('userId', 'username avatar')
        .lean(),
      Discussion.countDocuments(filter),
    ]);

    return {
      discussions: discussions.map((d) => ({
        id: d._id.toString(),
        title: d.title,
        content: d.content,
        upvoteCount: d.upvotes.length,
        replyCount: d.replyCount,
        author: formatAuthor(d.userId as unknown as { username: string; avatar: string }),
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      pagination: getPagination(query.page, query.limit, total),
    };
  }

  async getById(discussionId: string) {
    const discussion = await Discussion.findById(discussionId).populate('userId', 'username avatar');
    if (!discussion) throw new NotFoundError('Discussion not found');

    const replies = await DiscussionReply.find({ discussionId: discussion._id })
      .sort({ createdAt: 1 })
      .populate('userId', 'username avatar')
      .lean();

    return {
      id: discussion._id.toString(),
      title: discussion.title,
      content: discussion.content,
      upvoteCount: discussion.upvotes.length,
      replyCount: discussion.replyCount,
      author: formatAuthor(discussion.userId as unknown as { username: string; avatar: string }),
      createdAt: discussion.createdAt,
      updatedAt: discussion.updatedAt,
      replies: replies.map((r) => ({
        id: r._id.toString(),
        content: r.content,
        upvoteCount: r.upvotes.length,
        author: formatAuthor(r.userId as unknown as { username: string; avatar: string }),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  }

  async create(userId: string, input: CreateDiscussionInput) {
    const problem = await findProblemByIdOrSlug(input.problemSlug);
    if (!problem) throw new NotFoundError('Problem not found');

    const discussion = await Discussion.create({
      problemId: problem._id,
      userId: new Types.ObjectId(userId),
      title: input.title,
      content: input.content,
      upvotes: [],
      replyCount: 0,
    });

    const user = await discussion.populate('userId', 'username avatar');

    return {
      id: discussion._id.toString(),
      title: discussion.title,
      content: discussion.content,
      upvoteCount: 0,
      replyCount: 0,
      author: formatAuthor((user.userId as unknown as { username: string; avatar: string }) ?? null),
      createdAt: discussion.createdAt,
    };
  }

  async reply(discussionId: string, userId: string, input: CreateReplyInput) {
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) throw new NotFoundError('Discussion not found');

    const replyDoc = await DiscussionReply.create({
      discussionId: discussion._id,
      userId: new Types.ObjectId(userId),
      content: input.content,
      upvotes: [],
    });

    discussion.replyCount += 1;
    await discussion.save();
    await replyDoc.populate('userId', 'username avatar');

    return {
      id: replyDoc._id.toString(),
      content: replyDoc.content,
      upvoteCount: 0,
      author: formatAuthor(replyDoc.userId as unknown as { username: string; avatar: string }),
      createdAt: replyDoc.createdAt,
    };
  }

  async update(discussionId: string, userId: string, input: UpdateDiscussionInput) {
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) throw new NotFoundError('Discussion not found');
    if (discussion.userId.toString() !== userId) throw new ForbiddenError('You can only edit your own discussions');

    if (input.title) discussion.title = input.title;
    if (input.content) discussion.content = input.content;
    await discussion.save();

    return {
      id: discussion._id.toString(),
      title: discussion.title,
      content: discussion.content,
      updatedAt: discussion.updatedAt,
    };
  }

  async delete(discussionId: string, userId: string) {
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) throw new NotFoundError('Discussion not found');
    if (discussion.userId.toString() !== userId) throw new ForbiddenError('You can only delete your own discussions');

    await DiscussionReply.deleteMany({ discussionId: discussion._id });
    await Discussion.deleteOne({ _id: discussion._id });
  }

  async upvoteDiscussion(discussionId: string, userId: string) {
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) throw new NotFoundError('Discussion not found');

    const uid = new Types.ObjectId(userId);
    const index = discussion.upvotes.findIndex((id) => id.toString() === userId);
    if (index >= 0) {
      discussion.upvotes.splice(index, 1);
    } else {
      discussion.upvotes.push(uid);
    }
    await discussion.save();

    return { upvoteCount: discussion.upvotes.length, upvoted: index < 0 };
  }

  async upvoteReply(replyId: string, userId: string) {
    const reply = await DiscussionReply.findById(replyId);
    if (!reply) throw new NotFoundError('Reply not found');

    const uid = new Types.ObjectId(userId);
    const index = reply.upvotes.findIndex((id) => id.toString() === userId);
    if (index >= 0) {
      reply.upvotes.splice(index, 1);
    } else {
      reply.upvotes.push(uid);
    }
    await reply.save();

    return { upvoteCount: reply.upvotes.length, upvoted: index < 0 };
  }
}

export const discussionService = new DiscussionService();
