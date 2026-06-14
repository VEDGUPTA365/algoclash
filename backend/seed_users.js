import pool from './src/config/db.js';
import bcrypt from 'bcrypt';

const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Sam', 'Jamie', 'Charlie', 'Drew', 'Avery', 'Parker', 'Peyton', 'Quinn', 'Skyler', 'Cameron', 'Blake', 'Jesse', 'Reese', 'Rowan'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

async function seedUsers() {
  const passwordHash = await bcrypt.hash('password123', 10);
  console.log('Seeding 20 fake players...');
  
  for (let i = 0; i < 20; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const username = `${fn.toLowerCase()}_${ln.toLowerCase()}_${Math.floor(Math.random() * 9999)}`;
    const email = `${username}@example.com`;
    
    // Generate a random rating between 500 and 2200
    const rating = Math.floor(Math.random() * (2200 - 500 + 1)) + 500;
    
    // Generate random wins and losses
    const wins = Math.floor(Math.random() * 50);
    const losses = Math.floor(Math.random() * 50);
    
    try {
      await pool.query(
        `INSERT INTO users (username, email, password, rating) 
         VALUES ($1, $2, $3, $4)`,
        [username, email, passwordHash, rating]
      );
      console.log(`Created user: ${username} | Rating: ${rating}`);
    } catch (err) {
      console.error(`Failed to create ${username}:`, err.message);
    }
  }
  
  console.log('Done seeding users!');
  process.exit(0);
}

seedUsers();
