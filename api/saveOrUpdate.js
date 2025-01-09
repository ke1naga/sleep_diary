// api/saveOrUpdate.js
import mysql from 'mysql2/promise';
import { parseISO, format, isValid } from 'date-fns';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

function isValidDate(dateString) {
  const date = parseISO(dateString);
  return isValid(date);
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { date, value, mood, diary } = req.body;

    if (!date || !isValidDate(date)) {
      return res.status(400).json({ error: '無効な日付形式です' });
    }

    if (value === undefined) {
      return res.status(400).json({ error: '値が必要です' });
    }

    const localDate = parseISO(date);
    const formattedDate = format(localDate, 'yyyy-MM-dd');

    const query = `
      INSERT INTO sleep_info (date, value, mood, diary)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      value = VALUES(value),
      mood = VALUES(mood),
      diary = VALUES(diary);
    `;

    try {
      const [result] = await db.query(query, [formattedDate, value, mood, diary]);
      res.status(200).json({ message: 'データが保存または更新されました', result });
    } catch (error) {
      console.error('データベースエラー:', error);
      res.status(500).json({ error: 'データベースエラー', message: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
