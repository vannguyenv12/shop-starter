import express from 'express';
import { categoryController } from '../controller/category.controller';
import { validateSchema } from '~/globals/middlewares/validate.middleware';
import { createCategorySchema } from '../schema/category.schema';

const categoryRoute = express.Router();

categoryRoute.post('/', validateSchema(createCategorySchema), categoryController.create);
categoryRoute.get('/', categoryController.getAll);
categoryRoute.get('/:id', categoryController.get);

export default categoryRoute;