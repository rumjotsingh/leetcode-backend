import { Tag } from './tag.model';

export class TagService {
  async getAll() {
    const tags = await Tag.find().sort({ name: 1 }).lean();
    return tags.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      slug: t.slug,
    }));
  }
}

export const tagService = new TagService();
