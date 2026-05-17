import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import driverService from '../services/driver.service';

class DriverController {
  async getManifest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.id;
      const manifest = await driverService.getManifest(driverId);
      const routeInfo = await driverService.getRouteInfo(driverId);
      
      res.json({
        success: true,
        data: {
          manifest,
          bus_number: routeInfo?.bus_number,
          route_name: routeInfo?.route_name
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  async getNotices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const branchId = req.user!.branch_id;
      const notices = await driverService.getNotices(branchId!);
      
      res.json({
        success: true,
        data: notices
      });
    } catch (error) {
      return next(error);
    }
  }

  async createNotice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, content, stations } = req.body;
      const driverId = req.user!.id;
      const driverName = req.user!.name;

      const notice = await driverService.createNotice({
        title,
        content,
        stations,
        driverId,
        driverName
      });

      res.status(201).json({
        success: true,
        data: notice,
        message: 'Notice broadcasted successfully'
      });
    } catch (error) {
      return next(error);
    }
  }

  async deleteNotice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const driverId = req.user!.id;

      const result = await driverService.deleteNotice(id, driverId);

      if (!result) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Notice not found or unauthorized' }
        });
      }

      res.json({
        success: true,
        message: 'Notice deleted successfully'
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default new DriverController();
