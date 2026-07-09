import { Playlist } from '../modules/playlists/playlist.model';
import { Problem } from '../modules/problems/problem.model';

const OFFICIAL_PLAYLISTS = [
  {
    title: 'Interview 150',
    slug: 'interview-150',
    description: 'Curated must-do problems for coding interviews — arrays, strings, trees, graphs, and DP.',
    tagFilters: [['Arrays'], ['Strings'], ['Dynamic Programming'], ['Graphs'], ['Trees']],
    limit: 30,
  },
  {
    title: 'Master Array',
    slug: 'master-array',
    description: 'Strengthen your array fundamentals with classic array manipulation problems.',
    tagFilters: [['Arrays'], ['Prefix Sum'], ['Two Pointers'], ['Sliding Window']],
    limit: 25,
  },
  {
    title: 'DP Master',
    slug: 'dp-master',
    description: 'Dynamic programming patterns from beginner to advanced.',
    tagFilters: [['Dynamic Programming']],
    limit: 20,
  },
  {
    title: 'Graph Essentials',
    slug: 'graph-essentials',
    description: 'BFS, DFS, and shortest-path problems to master graph algorithms.',
    tagFilters: [['Graphs'], ['BFS'], ['DFS']],
    limit: 15,
  },
  {
    title: 'Blind 75 Style',
    slug: 'blind-75-style',
    description: 'High-frequency interview problems covering all major patterns.',
    tagFilters: [['Hashing'], ['Binary Search'], ['Greedy'], ['Stack'], ['Queue']],
    limit: 25,
  },
];

async function collectProblems(tagFilters: string[][], limit: number) {
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const tags of tagFilters) {
    for (const tag of tags) {
      const problems = await Problem.find({ tags: new RegExp(tag, 'i') })
        .select('_id')
        .limit(Math.ceil(limit / tagFilters.length) + 5)
        .lean();

    for (const p of problems) {
      const id = p._id.toString();
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
      if (ids.length >= limit) return ids;
    }
    }
  }

  if (ids.length < limit) {
    const extra = await Problem.find({ _id: { $nin: ids } })
      .select('_id')
      .limit(limit - ids.length)
      .lean();
    for (const p of extra) ids.push(p._id.toString());
  }

  return ids.slice(0, limit);
}

export async function seedPlaylists(): Promise<void> {
  const existing = await Playlist.countDocuments({ isOfficial: true });
  if (existing > 0) {
    console.log('Official playlists already seeded, skipping');
    return;
  }

  for (const spec of OFFICIAL_PLAYLISTS) {
    const problemIds = await collectProblems(spec.tagFilters, spec.limit);
    await Playlist.create({
      title: spec.title,
      slug: spec.slug,
      description: spec.description,
      isOfficial: true,
      isPublic: true,
      createdBy: null,
      problems: problemIds,
    });
    console.log(`Seeded playlist: ${spec.title} (${problemIds.length} problems)`);
  }
}
