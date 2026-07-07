import { DEFAULT_TAGS } from '../config/constants';
import { Tag } from '../modules/tags/tag.model';
import { connectDatabase, disconnectDatabase } from './connection';

export async function seedTags(): Promise<void> {
  const existingCount = await Tag.countDocuments();
  if (existingCount > 0) {
    console.log('Tags already seeded, skipping');
    return;
  }

  const tags = DEFAULT_TAGS.map((name) => ({ name, slug: name.toLowerCase().replace(/\s+/g, '-') }));
  await Tag.insertMany(tags);
  console.log(`Seeded ${tags.length} tags`);
}

if (require.main === module) {
  connectDatabase()
    .then(seedTags)
    .then(() => disconnectDatabase())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
