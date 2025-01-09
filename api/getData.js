// api/getData.js
import mysql from 'mysql2/promise';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const [results] = await db.query('SELECT * FROM sleep_info ORDER BY date ASC');
      res.status(200).json(results);
    } catch (error) {
      console.error('データ取得エラー:', error);
      res.status(500).json({ error: 'データ取得エラー', message: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
