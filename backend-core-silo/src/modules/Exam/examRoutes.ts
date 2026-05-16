import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/authMiddleware';
import {
  listExams,
  startExam,
  submitExam,
  saveAnswer,
  getManagementExams,
  createExam,
} from './examController';

const router = Router();

router.use(authenticateToken);

// Student
router.get('/', authorizeRoles('Student', 'Parent'), listExams);
router.post('/:examId/start', authorizeRoles('Student'), startExam);
router.post('/:examId/submit', authorizeRoles('Student'), submitExam);
router.post('/save-answer', authorizeRoles('Student'), saveAnswer);

// Management
router.get('/management', authorizeRoles('Admin', 'SuperAdmin', 'VicePrincipal', 'SchoolAdmin'), getManagementExams);
router.post('/', authorizeRoles('Admin', 'SuperAdmin', 'VicePrincipal', 'SchoolAdmin'), createExam);

export default router;
