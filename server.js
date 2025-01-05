const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// MySQL接続設定
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'kei',  
  password: 'zcbmadgjl',  
  database: 'sleep_data',
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
app.use(bodyParser.json());

// 数値をデータベースに保存するエンドポイント
app.post('/save', (req, res) => {
  const {data,value } = req.body;
  connection.query('INSERT INTO data (data,value) VALUES (?,?)'[data,value],(err,result)=>{
    if (err) {
        res.status(500).json({error:'データベースエラー'});
    }else{
    res.json({message:'データが保存されました',data:result});
  }
});
});

// データ取得エンドポイント
app.get('/getData', (req, res) => {
    connection.query('SELECT * FROM data', (err, results) => {
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
