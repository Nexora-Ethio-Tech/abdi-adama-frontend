import pool from '../config/database';

class DriverService {
  async getManifest(driverId: string) {
    const result = await pool.query(
      `SELECT 
        u.name as student_name,
        u.digital_id,
        s.grade,
        r.name as route_name,
        v.plate_number as bus_number
      FROM student_routes sr
      JOIN routes r ON sr.route_id = r.id
      JOIN students s ON sr.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.driver_id = $1`,
      [driverId]
    );
    return result.rows;
  }

  async getRouteInfo(driverId: string) {
    const result = await pool.query(
      `SELECT r.name as route_name, v.plate_number as bus_number
       FROM routes r
       LEFT JOIN vehicles v ON r.vehicle_id = v.id
       WHERE r.driver_id = $1
       LIMIT 1`,
      [driverId]
    );
    return result.rows[0];
  }

  async getNotices(branchId: string) {
    const result = await pool.query(
      `SELECT * FROM logistics_notices 
       WHERE driver_id IN (SELECT id FROM users WHERE branch_id = $1)
       ORDER BY created_at DESC`,
      [branchId]
    );
    return result.rows;
  }

  async createNotice(data: { title: string; content: string; stations?: string; driverId: string; driverName: string }) {
    const result = await pool.query(
      `INSERT INTO logistics_notices (title, content, stations, driver_id, driver_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.title, data.content, data.stations, data.driverId, data.driverName]
    );
    return result.rows[0];
  }

  async deleteNotice(id: string, driverId: string) {
    const result = await pool.query(
      'DELETE FROM logistics_notices WHERE id = $1 AND driver_id = $2 RETURNING *',
      [id, driverId]
    );
    return result.rows[0];
  }
}

export default new DriverService();
