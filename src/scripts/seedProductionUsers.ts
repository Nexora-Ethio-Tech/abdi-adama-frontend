import pool from '../config/database';
import { hashPassword } from '../utils/password';
import { UserRole, UserStatus } from '../types';
import logger from '../utils/logger';

async function seed() {
  const users = [
    { name: 'Dr. Senait Fisseha', digital_id: 'CLN-4001', pin: '4001', role: UserRole.CLINIC_ADMIN, email: 'clinic@abdi-adama.com' },
    { name: 'Yonas Kebede', digital_id: 'DRV-3001', pin: '3001', role: UserRole.DRIVER, email: 'driver1@abdi-adama.com' },
    { name: 'Seyum Hailemariam', digital_id: 'DRV-1111', pin: '1111', role: UserRole.DRIVER, email: 'driver2@abdi-adama.com' },
    { name: 'Daniel Tadesse', digital_id: 'PAR-2002', pin: '2002', role: UserRole.PARENT, email: 'parent1@abdi-adama.com' },
    { name: 'Lemma Parent', digital_id: 'PAR-2003', pin: '2003', role: UserRole.PARENT, email: 'parent2@abdi-adama.com' },
    { name: 'Abel Daniel', digital_id: 'STU-1001', pin: '1001', role: UserRole.STUDENT, email: 'student1@abdi-adama.com' },
    { name: 'Bethlehem Lemma', digital_id: 'STU-1002', pin: '1002', role: UserRole.STUDENT, email: 'student2@abdi-adama.com' },
    { name: 'Lemma Alemu', digital_id: 'STU-1111', pin: '1111', role: UserRole.STUDENT, email: 'student3@abdi-adama.com' }
  ];

  try {
    for (const user of users) {
      const hashedPassword = await hashPassword(user.pin);
      
      // Check if user exists
      const existing = await pool.query('SELECT id FROM users WHERE digital_id = $1', [user.digital_id]);
      
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO users (id, digital_id, name, email, password_hash, role, status, is_active, username)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, $7)`,
          [user.digital_id, user.name, user.email, hashedPassword, user.role, UserStatus.APPROVED, user.digital_id.toLowerCase()]
        );
        logger.info(`Seeded user: ${user.name} (${user.digital_id})`);
      } else {
        // Update password just in case
        await pool.query(
          'UPDATE users SET password_hash = $1 WHERE digital_id = $2',
          [hashedPassword, user.digital_id]
        );
        logger.info(`Updated user: ${user.name} (${user.digital_id})`);
      }
    }
    logger.info('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
