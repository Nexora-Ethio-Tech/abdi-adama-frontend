import { Router } from 'express';
import studentController from '../controllers/student.controller';
import { authenticate } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { UserRole } from '../types';
import { validate, schemas } from '../middleware/validator';

const router = Router();

router.use(authenticate);
router.use(roleGuard([UserRole.STUDENT]));

// Exam Taking
router.get('/exams', studentController.listExams);
router.post('/exams/:id/start', studentController.startExam);
router.post('/exams/save-answer', validate(schemas.saveAnswer), studentController.saveAnswer);
router.post('/exams/submit', validate(schemas.submitExam), studentController.submitExam);

export default router;
