import pool from './connection.js';

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Add any initial data if needed
    // For now, we'll just verify the tables exist

    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('✅ Database tables verified:');
    tablesResult.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });

    console.log('🎉 Database seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
