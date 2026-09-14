import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema } from '../../utils/validators.js';
import { descriptionBodySchema, listDescriptionsQuery } from './description.validation.js';
import * as controller from './description.controller.js';

const router = Router();

router.get('/', validate({ query: listDescriptionsQuery }), controller.list);
router.get('/options', controller.options);
router.post('/', validate({ body: descriptionBodySchema }), controller.create);
router.put('/:id', validate({ params: idParamSchema, body: descriptionBodySchema }), controller.update);
router.delete('/:id', validate({ params: idParamSchema }), controller.remove);

export default router;
