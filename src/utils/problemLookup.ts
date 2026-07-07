import { Problem, IProblem } from '../modules/problems/problem.model';

export async function findProblemByIdOrSlug(idOrSlug: string): Promise<IProblem | null> {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
  if (isObjectId) {
    return Problem.findById(idOrSlug);
  }
  return Problem.findOne({ slug: idOrSlug.toLowerCase() });
}
