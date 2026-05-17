import { Response, NextFunction } from 'express';
import logger from '../utils/logger';
import authService from '../services/auth.service';
import { AuthRequest, LoginDTO, ChangePasswordDTO } from '../types';

class AuthController {
  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Support both 'email' (backend standard) and 'school_id' (frontend standard)
      const { email, school_id, password } = req.body;
      const identifier = email || school_id;

      if (!identifier || !password) {
        res.status(400).json({
          success: false,
          message: 'Identifier and password are required'
        });
        return;
      }

      const result = await authService.login(identifier, password);

      // Return format compatible with frontend expectations
      res.json({
        success: true,
        token: result.accessToken,
        refreshToken: result.refreshToken,
        user: {
          user_id: result.user.id,
          full_name: result.user.name,
          school_id: result.user.digital_id,
          role: result.user.role,
          email: result.user.email
        },
        message: 'Login successful'
      });
    } catch (error: any) {
      // Ensure we return a message property for the frontend
      res.status(error.statusCode || 401).json({
        success: false,
        message: error.message || 'Invalid credentials'
      });
    }
  }

  async refreshToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message: 'Refresh token is required'
          }
        });
        return;
      }

      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
        message: 'Token refreshed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getCurrentUser(req.user!.id);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body as ChangePasswordDTO;
      const result = await authService.changePassword(req.user!.id, currentPassword, newPassword);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: AuthRequest, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  }
}

export default new AuthController();
