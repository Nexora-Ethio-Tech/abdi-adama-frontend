import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.map(d => d.message)
        }
      });
      return;
    }
    
    next();
  };
};

export const schemas = {
  login: Joi.object({
    email: Joi.string().optional(),
    school_id: Joi.string().optional(),
    password: Joi.string().required(),
    role: Joi.string().optional()
  }).or('email', 'school_id'),

  createUser: Joi.object({
    name: Joi.string().min(2).max(150).required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid('teacher', 'student', 'parent', 'finance-clerk', 'driver', 'librarian', 'clinic-admin').required(),
    branchId: Joi.string().uuid().optional(),
    password: Joi.string().min(8).optional(),
    grade: Joi.string().optional()
  }),

  // Schema for dedicated admin creation endpoints (no role field needed)
  createAdminUser: Joi.object({
    name: Joi.string().min(2).max(150).required(),
    email: Joi.string().email().required(),
    branchId: Joi.string().uuid().required(),
    password: Joi.string().min(8).optional()
  }),

  updateUserStatus: Joi.object({
    status: Joi.string().valid('Pending', 'Approved', 'Revoked').required()
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(150).optional(),
    email: Joi.string().email().optional(),
    grade: Joi.string().optional()
  }),

  assignStudentToClass: Joi.object({
    studentId: Joi.string().uuid().required(),
    classId: Joi.string().uuid().required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
  }),

  // Online Exam Schemas
  createExam: Joi.object({
    title: Joi.string().required(),
    subject_id: Joi.string().uuid().optional(),
    section_id: Joi.string().uuid().optional(),
    start_window: Joi.date().iso().required(),
    duration_minutes: Joi.number().integer().positive().required(),
    questions: Joi.array().items(
      Joi.object({
        text: Joi.string().required(),
        type: Joi.string().valid('multiple_choice', 'true_false', 'short_answer').default('multiple_choice'),
        options: Joi.array().items(Joi.string()).when('type', { is: 'multiple_choice', then: Joi.required() }),
        correct_answer: Joi.string().required(),
        points: Joi.number().integer().min(1).default(1)
      })
    ).min(1).required()
  }),

  saveAnswer: Joi.object({
    session_id: Joi.string().uuid().required(),
    question_id: Joi.string().uuid().required(),
    answer: Joi.string().required()
  }),

  submitExam: Joi.object({
    session_id: Joi.string().uuid().required(),
    status: Joi.string().valid('submitted', 'timed_out').default('submitted')
  })
};
