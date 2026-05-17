import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import academicService from '../services/academic.service';

class AcademicController {
  async calculateRanks(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const branchId = req.user!.branch_id;
      const { gradeLevel } = req.body;

      const result = await academicService.calculateRanks(branchId!, gradeLevel);

      res.json({
        success: true,
        data: result,
        message: 'Rankings calculated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getEvents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const branchId = req.user!.branch_id;
      const events = await academicService.getEvents(branchId!);

      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      next(error);
    }
  }

  async getGradesWithSections(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const branchId = req.user!.branch_id;
      const data = await academicService.getGradesWithSections(branchId!);

      res.json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AcademicController();
