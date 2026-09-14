import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as service from './client.service.js';

export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await service.listClients(req.validatedQuery);
  sendSuccess(res, { data, meta });
});

export const options = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.clientOptions(req.validatedQuery) });
});

export const getOne = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.getClient(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  const data = await service.createClient(req.body);
  sendSuccess(res, { statusCode: 201, message: 'Client created successfully', data });
});

export const update = asyncHandler(async (req, res) => {
  const data = await service.updateClient(req.params.id, req.body);
  sendSuccess(res, { message: 'Client updated successfully', data });
});

export const remove = asyncHandler(async (req, res) => {
  await service.deleteClient(req.params.id);
  sendSuccess(res, { message: 'Client deleted successfully' });
});
