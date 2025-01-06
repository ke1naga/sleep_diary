const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 3000;

const cors = require('cors');
app.use(cors()); // 全てのリクエストを許可

require('dotenv').config();  // dotenvを読み込む

// MySQL接続設定
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,  
  password: process.env.DB_PASSWORD,  
  database: process.env.DB_NAME,
});

// MySQL接続
connection.connect((err) => {
  if (err) {
    console.error('MySQL接続エラー:', err);
    return;
  }
  console.log('MySQLに接続しました');
});

// ミドルウェア
app.use(express.json());

// 日付形式が正しいかを検証する関数
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;  // YYYY-MM-DD の正規表現
  return regex.test(dateString);
}

// データの追加または上書きエンドポイント
const { utcToZonedTime, format } = require('date-fns-tz');

app.post('/saveOrUpdate', (req, res) => {
  const { date, value } = req.body;

  if (!date || !isValidDate(date)) {
    return res.status(400).json({ error: '無効な日付形式です' });
  }

  if (value === undefined) {
    return res.status(400).json({ error: '値が必要です' });
  }

      // 日付を日本時間で保存する
      const jstDate = utcToZonedTime(new Date(date), 'Asia/Tokyo');
      const formattedDate = format(jstDate, 'yyyy-MM-dd');
  

  const query = `
    INSERT INTO sleep_info (date, value)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE
    value = VALUES(value)
  `;

  connection.query(query, [date, value], (err, result) => {
    if (err) {
      console.error('データベースエラー:', err);
      res.status(500).json({ error: 'データベースエラー',message: err.message});
    } else {
      res.json({ message: 'データが保存または更新されました', result });
    }
  });
});



// データ取得エンドポイント
app.get('/getData', (req, res) => {
    connection.query('SELECT * FROM sleep_info ORDER BY date ASC', (err, results) => {
      if (err) {
        res.status(500).json({ error: 'データ取得エラー' });
      } else {
        res.json(results); // データをJSON形式で返す
      }
    });
  });


// サーバーを起動
app.listen(port, () => {
  console.log(`サーバーがhttp://localhost:${port}で動作しています`);
});
