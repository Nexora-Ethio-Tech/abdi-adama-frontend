import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { roleGuard } from '../../middleware/roleGuard';
import { UserRole } from '../../types';
import {
  listExams,
  startExam,
  submitExam,
  saveAnswer,
  getManagementExams,
  createExam,
  togglePublish,
  deleteExam,
  getExamSubmissions
} from './examController';

const router = Router();

router.use(authenticate);

// Student
router.get('/', roleGuard([UserRole.STUDENT, UserRole.PARENT]), listExams);
router.post('/:examId/start', roleGuard([UserRole.STUDENT]), startExam);
router.post('/:examId/submit', roleGuard([UserRole.STUDENT]), submitExam);
router.post('/save-answer', roleGuard([UserRole.STUDENT]), saveAnswer);

// Management
router.get('/management', roleGuard([UserRole.SUPER_ADMIN, UserRole.VICE_PRINCIPAL, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]), getManagementExams);
router.post('/', roleGuard([UserRole.SUPER_ADMIN, UserRole.VICE_PRINCIPAL, UserRole.SCHOOL_ADMIN, UserRole.TEACHER]), createExam);
router.patch('/:examId/publish', roleGuard([UserRole.TEACHER]), togglePublish);
router.delete('/:examId', roleGuard([UserRole.TEACHER]), deleteExam);
router.get('/:examId/submissions', roleGuard([UserRole.TEACHER]), getExamSubmissions);

export default router;
