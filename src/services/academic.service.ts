import pool from '../config/database';

class AcademicService {
  async calculateRanks(branchId: string, gradeLevel?: string) {
    // This is a simplified ranking calculation logic
    // In a real system, this would involve complex SQL to aggregate scores
    // For now, we'll implement a query that updates the 'rank' column in academic_history
    
    const query = `
      WITH student_averages AS (
        SELECT 
          student_id,
          AVG(score) as avg_score
        FROM grades
        JOIN students s ON grades.student_id = s.id
        WHERE s.branch_id = $1
        ${gradeLevel ? 'AND s.grade = $2' : ''}
        GROUP BY student_id
      ),
      ranked_students AS (
        SELECT 
          student_id,
          avg_score,
          RANK() OVER (ORDER BY avg_score DESC) as student_rank
        FROM student_averages
      )
      UPDATE academic_history ah
      SET 
        average = rs.avg_score::text,
        rank = rs.student_rank::text,
        updated_at = NOW()
      FROM ranked_students rs
      WHERE ah.student_id = rs.student_id
      RETURNING ah.*;
    `;

    const params = gradeLevel ? [branchId, gradeLevel] : [branchId];
    const result = await pool.query(query, params);
    return result.rows;
  }

  async getEvents(branchId: string) {
    const result = await pool.query(
      `SELECT * FROM events 
       WHERE branch_id = $1 OR branch_id IS NULL
       ORDER BY date ASC`,
      [branchId]
    );
    return result.rows;
  }

  async getGradesWithSections(branchId: string) {
    const result = await pool.query(
      `SELECT 
        name as class_name,
        teacher_id,
        student_count,
        id as class_id
      FROM classes
      WHERE branch_id = $1
      ORDER BY name`,
      [branchId]
    );
    return result.rows;
  }
}

export default new AcademicService();
