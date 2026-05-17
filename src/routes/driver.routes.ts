import { Router } from 'express';
import driverController from '../controllers/driver.controller';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { UserRole } from '../types';
import Joi from 'joi';
import { validate } from '../middleware/validator';

const router = Router();

router.use(authenticate);

// Validation schemas
const noticeSchema = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  stations: Joi.string().allow('')
});

// Driver role required for posting/deleting
router.get('/manifest', roleGuard([UserRole.DRIVER]), driverController.getManifest);
router.get('/notices', driverController.getNotices); // Accessible by VP and others too
router.post('/notice', roleGuard([UserRole.DRIVER]), validate(noticeSchema), driverController.createNotice);
router.delete('/notice/:id', roleGuard([UserRole.DRIVER]), driverController.deleteNotice);

export default router;
