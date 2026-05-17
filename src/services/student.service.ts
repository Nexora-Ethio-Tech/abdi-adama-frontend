import pool from '../config/database';

class StudentService {
  async listExams(studentUserId: string, branchId: string | null) {
    const result = await pool.query(
      `SELECT e.id, e.title, e.category, e.duration_minutes, e.created_at,
              c.name AS course_name,
              (SELECT count(*) FROM exam_questions WHERE exam_id = e.id) as questions_count,
              es.status AS my_status,
              es.final_score AS my_score
       FROM exams e
       LEFT JOIN courses c ON c.id = e.course_id
       LEFT JOIN students s ON s.user_id = $1
       LEFT JOIN exam_submissions es ON es.exam_id = e.id AND es.student_id = s.id
       WHERE (e.branch_id = $2 OR e.branch_id IS NULL) 
         AND e.is_hidden = FALSE
       ORDER BY e.created_at DESC`,
      [studentUserId, branchId]
    );
    return result.rows;
  }

  async startExam(studentUserId: string, examId: string) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const studentRes = await client.query('SELECT id FROM students WHERE user_id = $1', [studentUserId]);
      if (studentRes.rows.length === 0) throw new Error('Student record not found');
      const studentId = studentRes.rows[0].id;

      // 1. Fetch Exam + Questions
      const examRes = await client.query(`SELECT id, title, duration_minutes FROM exams WHERE id = $1`, [examId]);
      if (examRes.rowCount === 0) throw new Error('Exam not found');
      const exam = examRes.rows[0];

      const questionsRes = await client.query(
        `SELECT q.id, q.question_text as text, 
                (SELECT json_agg(json_build_object('key', o.option_key, 'text', o.option_text)) 
                 FROM exam_question_options o WHERE o.question_id = q.id) as options
         FROM exam_questions q 
         WHERE q.exam_id = $1 
         ORDER BY q.sort_order ASC`,
        [examId]
      );

      // 2. Upsert Submission/Session
      const submissionRes = await client.query(
        `INSERT INTO exam_submissions (exam_id, student_id, started_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (exam_id, student_id) DO UPDATE SET started_at = NOW()
         RETURNING id, started_at`,
        [examId, studentId]
      );

      await client.query('COMMIT');

      return {
        exam: {
          ...exam,
          questions: questionsRes.rows
        },
        submission_id: submissionRes.rows[0].id,
        server_time: new Date().toISOString()
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async saveAnswer(submissionId: string, questionId: string, answer: string) {
    // We'll store answers in a separate table for atomicity
    // But wait, the schema has 'answers' as JSONB in 'exam_submissions'.
    // Let's use a sub-table or update the JSONB. 
    // To keep it simple and consistent with the atomic requirement, let's update the JSONB.
    
    await pool.query(
      `UPDATE exam_submissions 
       SET answers = answers || jsonb_build_object($1::text, $2::text)
       WHERE id = $3`,
      [questionId, answer, submissionId]
    );
  }

  async submitExam(submissionId: string, status: string = 'submitted') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch correct answers
      const submissionRes = await client.query('SELECT exam_id, answers FROM exam_submissions WHERE id = $1', [submissionId]);
      if (submissionRes.rows.length === 0) throw new Error('Submission not found');
      const { exam_id, answers } = submissionRes.rows[0];

      const questionsRes = await client.query(
        'SELECT id, correct_option_id FROM exam_questions WHERE exam_id = $1',
        [exam_id]
      );

      let score = 0;
      questionsRes.rows.forEach(q => {
        if (answers[q.id] === q.correct_option_id) {
          score += 1;
        }
      });

      // 2. Finalize submission
      const result = await client.query(
        `UPDATE exam_submissions 
         SET submitted_at = NOW(), status = $1, final_score = $2
         WHERE id = $3
         RETURNING final_score`,
        [status, score, submissionId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new StudentService();
