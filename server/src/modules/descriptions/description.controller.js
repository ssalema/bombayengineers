import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as service from './description.service.js';

export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await service.listDescriptions(req.validatedQuery);
  sendSuccess(res, { data, meta });
});

export const options = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await service.descriptionOptions() });
});

export const create = asyncHandler(async (req, res) => {
  const data = await service.createDescription(req.body);
  sendSuccess(res, { statusCode: 201, message: 'Description created successfully', data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await service.updateDescription(req.params.id, req.body);
  sendSuccess(res, { message: 'Description updated successfully', data });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteDescription(req.params.id);
  sendSuccess(res, { message: 'Description deleted successfully' });
});
