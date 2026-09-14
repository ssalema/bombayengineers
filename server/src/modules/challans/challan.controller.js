import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import * as service from './challan.service.js';
import { peekNextChallanNo } from './challanNumber.service.js';

export const list = asyncHandler(async (req, res) => {
  const { data, meta } = await service.listChallans(req.validatedQuery);
  sendSuccess(res, { data, meta });
});

export const summary = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.summarizeChallans(req.validatedQuery) });
});

export const nextNumber =asyncHandler(async (req, res) => {
  const challanNo = await peekNextChallanNo(req.validatedQuery.date ?? new Date());
  res.set('Cache-Control', 'no-store');
  sendSuccess(res, { data: { challanNo } });
});

export const getOne = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await service.getChallan(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  const data = await service.createChallan(req.body, req.user.id);
  sendSuccess(res, { statusCode: 201, message: `Challan ${data.challanNo} saved successfully`, data });
});

export const remove = asyncHandler(async (req, res) => {
  const challan = await service.deleteChallan(req.params.id);
  sendSuccess(res, { message: `Challan ${challan.challanNo} deleted successfully` });
});
