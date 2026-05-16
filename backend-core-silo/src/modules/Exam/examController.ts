import { Response } from 'express';
import pool from '../../config/db';
import { AuthRequest } from '../../middleware/authMiddleware';
import { sendSuccess, sendError } from '../../shared/responseUtils';

// ─── Exam Management (Admin / VP / Teacher) ───────────────────────────────────

/**
 * GET /api/exams/management
 * Returns all exams for the user's branch/role.
 */
export const getManagementExams = async (req: AuthRequest, res: Response) => {
  const { identity_id, branch_id, role } = req.user || {};
  const isPowerUser = ['viceprincipal', 'schooladmin', 'admin', 'superadmin'].includes((role || '').toLowerCase());

  try {
    const result = await pool.query(
      `SELECT e.*, 
              s.name AS subject_name, 
              si.full_name AS creator_name,
              (SELECT count(*) FROM online_exam_questions WHERE exam_id = e.id) as question_count
       FROM online_exams e
       LEFT JOIN silo_courses s ON s.id = e.subject_id
       LEFT JOIN silo_identities si ON si.id = e.creator_id
       WHERE (e.branch_id = $1 OR $2 = TRUE)
       ORDER BY e.created_at DESC`,
      [branch_id, role?.toLowerCase() === 'superadmin']
    );
    return sendSuccess(res, result.rows);
  } catch (err: any) {
    return sendError(res, 'Failed to fetch exams.', 500, err.message);
  }
};

/**
 * POST /api/exams
 * Creates an exam and its questions.
 */
export const createExam = async (req: AuthRequest, res: Response) => {
  const { title, subject_id, section_id, start_window, duration_minutes, questions } = req.body;
  const { identity_id, branch_id } = req.user || {};

  if (!title || !start_window || !duration_minutes) {
    return sendError(res, 'Missing required fields.', 400);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert Exam
    const examResult = await client.query(
      `INSERT INTO online_exams (branch_id, subject_id, section_id, creator_id, title, start_window, duration_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [branch_id, subject_id, section_id, identity_id, title, start_window, duration_minutes]
    );
    const examId = examResult.rows[0].id;

    // 2. Insert Questions
    if (Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await client.query(
          `INSERT INTO online_exam_questions (exam_id, question_text, question_type, options_json, correct_answer, points, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [examId, q.text, q.type || 'multiple_choice', JSON.stringify(q.options || []), q.correct_answer, q.points || 1, i]
        );
      }
    }

    await client.query('COMMIT');
    return sendSuccess(res, { id: examId }, 'Exam created successfully.', 201);
  } catch (err: any) {
    await client.query('ROLLBACK');
    return sendError(res, 'Failed to create exam.', 500, err.message);
  } finally {
    client.release();
  }
};

// ─── Student Operations ───────────────────────────────────────────────────────

/**
 * GET /api/exams
 * Lists exams available to the student.
 */
export const listExams = async (req: AuthRequest, res: Response) => {
  const { identity_id, branch_id } = req.user || {};

  try {
    const result = await pool.query(
      `SELECT e.id, e.title, e.start_window, e.duration_minutes,
              s.name AS subject_name,
              (SELECT count(*) FROM online_exam_questions WHERE exam_id = e.id) as questions_count,
              sess.status AS my_status,
              sess.final_score AS my_score
       FROM online_exams e
       LEFT JOIN silo_courses s ON s.id = e.subject_id
       LEFT JOIN online_exam_sessions sess ON sess.exam_id = e.id AND sess.student_id = $1
       WHERE e.branch_id = $2 AND e.is_published = TRUE
       ORDER BY e.start_window ASC`,
      [identity_id, branch_id]
    );

    return sendSuccess(res, {
        server_time: new Date().toISOString(),
        exams: result.rows
    });
  } catch (err: any) {
    return sendError(res, 'Failed to list exams.', 500, err.message);
  }
};

/**
 * POST /api/exams/:examId/start
 */
export const startExam = async (req: AuthRequest, res: Response) => {
  const { examId } = req.params;
  const { identity_id } = req.user || {};

  try {
    // 1. Fetch Exam + Questions
    const examRes = await pool.query(`SELECT * FROM online_exams WHERE id = $1`, [examId]);
    if (examRes.rowCount === 0) return sendError(res, 'Exam not found.', 404);
    const exam = examRes.rows[0];

    const questionsRes = await pool.query(
      `SELECT id, question_text as text, question_type as type, options_json as options, points 
       FROM online_exam_questions WHERE exam_id = $1 ORDER BY sort_order ASC`,
      [examId]
    );

    // 2. Upsert Session
    const sessionRes = await pool.query(
      `INSERT INTO online_exam_sessions (exam_id, student_id, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (exam_id, student_id) DO UPDATE SET status = 'active'
       RETURNING id, start_time`,
      [examId, identity_id]
    );

    // 3. Fetch existing answers
    const answersRes = await pool.query(
        `SELECT question_id, student_answer FROM online_exam_answers WHERE session_id = $1`,
        [sessionRes.rows[0].id]
    );
    const savedAnswers = answersRes.rows.reduce((acc: any, curr: any) => {
        acc[curr.question_id] = curr.student_answer;
        return acc;
    }, {});

    return sendSuccess(res, {
      session_id: sessionRes.rows[0].id,
      exam: {
          title: exam.title,
          duration_minutes: exam.duration_minutes,
          questions: questionsRes.rows
      },
      saved_answers: savedAnswers,
      server_time: new Date().toISOString()
    });
  } catch (err: any) {
    return sendError(res, 'Failed to start exam.', 500, err.message);
  }
};

/**
 * POST /api/exams/save-answer
 * Atomic save of a single answer.
 */
export const saveAnswer = async (req: AuthRequest, res: Response) => {
  const { session_id, question_id, answer } = req.body;

  try {
    await pool.query(
      `INSERT INTO online_exam_answers (session_id, question_id, student_answer)
       VALUES ($1, $2, $3)
       ON CONFLICT (session_id, question_id) DO UPDATE SET student_answer = $3, saved_at = NOW()`,
      [session_id, question_id, answer]
    );
    return sendSuccess(res, null, 'Answer saved.');
  } catch (err: any) {
    return sendError(res, 'Failed to save answer.', 500, err.message);
  }
};

/**
 * POST /api/exams/:examId/submit
 */
export const submitExam = async (req: AuthRequest, res: Response) => {
    const { examId } = req.params;
    const { session_id, status } = req.body; // status can be 'submitted' or 'terminated'

    try {
        await pool.query(
            `UPDATE online_exam_sessions 
             SET status = $1, end_time = NOW() 
             WHERE id = $2`,
            [status || 'submitted', session_id]
        );
        return sendSuccess(res, null, `Exam ${status || 'submitted'} successfully.`);
    } catch (err: any) {
        return sendError(res, 'Failed to submit exam.', 500, err.message);
    }
};
