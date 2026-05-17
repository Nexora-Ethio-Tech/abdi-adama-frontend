import { Router } from 'express';
import academicController from '../controllers/academic.controller';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { UserRole } from '../types';

const router = Router();

router.use(authenticate);

// Publicly accessible for authenticated users (with branch filter)
router.get('/events', academicController.getEvents);
router.get('/grades/with-sections', academicController.getGradesWithSections);

// VP or Admin required for ranking calculations
router.post('/transcripts/calculate-ranks', roleGuard([UserRole.VICE_PRINCIPAL, UserRole.SCHOOL_ADMIN]), academicController.calculateRanks);

export default router;
