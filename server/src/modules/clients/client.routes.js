import { Router } from 'express';
import { validate } from '../../middlewares/validate.js';
import { idParamSchema } from '../../utils/validators.js';
import { clientBodySchema, clientOptionsQuery, listClientsQuery } from './client.validation.js';
import * as controller from './client.controller.js';

const router = Router();

router.get('/', validate({ query: listClientsQuery }), controller.list);
router.get('/options', validate({ query: clientOptionsQuery }), controller.options);
router.post('/', validate({ body: clientBodySchema }), controller.create);
router.get('/:id', validate({ params: idParamSchema }), controller.getOne);
router.put('/:id', validate({ params: idParamSchema, body: clientBodySchema }), controller.update);
router.delete('/:id', validate({ params: idParamSchema }), controller.remove);

export default router;
