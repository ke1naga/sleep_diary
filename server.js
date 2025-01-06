const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

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

// 数値をデータベースに保存するエンドポイント
app.post('/save', (req, res) => {
  const {date,value } = req.body;
  console.log('Received data:',{date,value});
  connection.query('INSERT INTO sleep_info (date,value) VALUES (?,?)',[date,value],(err,result)=>{
    if (err) {
        res.status(500).json({error:'データベースエラー'});
    }else{
    res.json({message:'データが保存されました',data:result});
  }
});
});

// データの上書き
app.post('/updateData', (req, res) => {
  const { id, date, value } = req.body;

  // 必要なデータがあるか確認
  if (!id || !date || value === undefined) {
    return res.status(400).json({ error: '必要なデータが不足しています' });
  }

  const query = 'UPDATE sleep_info SET date = ?, value = ? WHERE id = ?';

  connection.query(query, [date, value, id], (err, result) => {
    if (err) {
      console.error('データ更新エラー:', err);
      res.status(500).json({ error: 'データ更新エラー' });
    } else {
      res.json({ success: true, affectedRows: result.affectedRows });
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
