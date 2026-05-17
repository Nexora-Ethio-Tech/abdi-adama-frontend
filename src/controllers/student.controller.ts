import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import studentService from '../services/student.service';

class StudentController {
  async listExams(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentUserId = req.user!.id;
      const branchId = req.user!.branch_id;

      const exams = await studentService.listExams(studentUserId, branchId);

      res.json({
        success: true,
        data: exams
      });
    } catch (error) {
      next(error);
    }
  }

  async startExam(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentUserId = req.user!.id;
      const { id } = req.params;

      const data = await studentService.startExam(studentUserId, id);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async saveAnswer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { session_id, question_id, answer } = req.body;

      await studentService.saveAnswer(session_id, question_id, answer);

      res.json({
        success: true,
        message: 'Answer saved'
      });
    } catch (error) {
      next(error);
    }
  }

  async submitExam(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { session_id, status } = req.body;

      const result = await studentService.submitExam(session_id, status);

      res.json({
        success: true,
        data: result,
        message: 'Exam submitted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new StudentController();
