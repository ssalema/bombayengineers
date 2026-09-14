import { Description } from '../../models/Description.js';
import { ApiError } from '../../utils/ApiError.js';
import { buildPaginationMeta, escapeRegex, indexedSort } from '../../utils/query.js';

const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

export async function listDescriptions({ page, limit, search, sort, order }) {
  const filter = {};
  if (search) filter.name = new RegExp(escapeRegex(search), 'i');

  const [data, total] = await Promise.all([
    indexedSort(Description.find(filter), { sort, order })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Description.countDocuments(filter),
  ]);

  return { data, meta: buildPaginationMeta({ page, limit, total }) };
}

/** Descriptions for the challan item dropdown. */
export async function descriptionOptions() {
  return Description.find()
    .collation(CASE_INSENSITIVE)
    .sort({ name: 1 })
    .select('name')
    .limit(1000)
    .lean();
}

async function assertUniqueName(name, excludeId) {
  const exists = await Description.findOne({ name, ...(excludeId && { _id: { $ne: excludeId } }) })
    .collation(CASE_INSENSITIVE)
    .select('_id')
    .lean();
  if (exists) {
    throw ApiError.conflict('This description already exists', [{ field: 'name', message: 'Description already exists' }]);
  }
}

export async function createDescription(body) {
  await assertUniqueName(body.name);
  return (await Description.create(body)).toObject();
}

export async function updateDescription(id, body) {
  await assertUniqueName(body.name, id);
  const doc = await Description.findByIdAndUpdate(id, body, { returnDocument: 'after', runValidators: true }).lean();
  if (!doc) throw ApiError.notFound('Description not found');
  return doc;
}

export async function deleteDescription(id) {
  // Challans store the text, so deleting a preset doesn't change them.
  const doc = await Description.findByIdAndDelete(id).lean();
  if (!doc) throw ApiError.notFound('Description not found');
  return doc;
}
