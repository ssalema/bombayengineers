import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema } from '../../utils/validators.js';
import { challanSummaryQuery, createChallanSchema, listChallansQuery, nextNumberQuery } from './challan.validation.js';
import * as controller from './challan.controller.js';

const router = Router();

router.get('/', validate({ query: listChallansQuery }), controller.list);
router.get('/summary', validate({ query: challanSummaryQuery }), controller.summary);
router.get('/next-number', validate({ query: nextNumberQuery }), controller.nextNumber);
router.post('/', validate({ body: createChallanSchema }), controller.create);
router.get('/:id', validate({ params: idParamSchema }), controller.getOne);
router.delete('/:id', validate({ params: idParamSchema }), controller.remove);

export default router;
