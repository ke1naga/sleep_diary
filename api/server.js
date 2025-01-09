const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session'); // セッションを使うために追加
const app = express();
const port = 3000;

const cors = require('cors');

require('dotenv').config();  // dotenvを読み込む

// データベース接続プールを設定
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// 非同期接続テスト
async function testConnection() {
  try {
    const [rows] = await db.query('SELECT 1');
    console.log('データベース接続成功:', rows);
  } catch (error) {
    console.error('データベース接続エラー:', error);
    process.exit(1); // エラー時はプロセス終了
  }
}
testConnection();

// 静的ファイルを提供
app.use(express.static('public')); // 'public' フォルダ内の静的ファイルを提供

// URLエンコードされたデータをパース
app.use(express.urlencoded({ extended: true })); 

app.use(cors()); // 全てのリクエストを許可
app.use(express.json()); // JSON

// セッション設定
app.use(session({
  secret: 'keikei',  // セッションの暗号化キー
  resave: false,
  saveUninitialized: true
}));


// ログインが必要なエンドポイント用のミドルウェア
function isAuthenticated(req, res, next) {
  if (req.session.loggedIn) {
    return next(); // ログインしている場合、次の処理へ
  } else {
    res.status(403).json({ error: 'ログインが必要です' }); // ログインしていない場合、403エラー
  }
}

// ログインページ
app.get('/login', (req, res) => {
  res.send(`
    <form method="POST" action="/login">
      <label for="username">ユーザー名:</label>
      <input type="text" id="username" name="username" required><br>
      <label for="password">パスワード:</label>
      <input type="password" id="password" name="password" required><br>
      <button type="submit">ログイン</button>
    </form>
  `);
});

// ログイン処理
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 簡易的なログイン認証（ユーザー名とパスワードを確認）
  if (username === 'kei' && password === 'keikei') {
    req.session.loggedIn = true; // ログイン成功時にセッションにフラグをセット
    res.redirect('/index.html'); // ログイン後、トップページにリダイレクト
  } else {
    res.send('ユーザー名またはパスワードが間違っています');
  }
});

// ログアウト処理
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('ログアウトに失敗しました');
    }
    res.redirect('/top.html'); // ログアウト後、ログインページにリダイレクト
  });
});

//日付がただしいかどうか
const { parseISO, format, isValid } = require('date-fns');

function isValidDate(dateString) {
  const date = parseISO(dateString);
  return isValid(date); //有効な日付かチェック
}

// データの追加または上書きエンドポイント
app.post('/saveOrUpdate', async(req, res) => {
  const { date, value, mood, diary } = req.body;

  console.log('受け取ったデータ:', { date, value, mood, diary });  // ここで確認

  if (!date || !isValidDate(date)) {
    return res.status(400).json({ error: '無効な日付形式です' });
  }

  if (value === undefined) {
    return res.status(400).json({ error: '値が必要です' });
  }

  // UTCの日付を取得し、ローカルタイムでフォーマット
  const localDate = parseISO(date);
  const formattedDate = format(localDate, 'yyyy-MM-dd'); // 'yyyy-MM-dd' の形式にフォーマット
  console.log(formattedDate);  // 例: '2025-01-09'
  
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
    res.json({ message: 'データが保存または更新されました', result });
  } catch (error) {
    console.error('データベースエラー:', error);
    res.status(500).json({ error: 'データベースエラー', message: error.message });
  }
});

// データ取得エンドポイント
app.get('/getData', isAuthenticated, async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM sleep_info ORDER BY date ASC');
    res.json(results);
  } catch (error) {
    console.error('データ取得エラー:', error);
    res.status(500).json({ error: 'データ取得エラー', message: error.message });
  }
});

// サーバーを起動
app.listen(port, '0.0.0.0', () => {
  console.log(`http://0.0.0.0:${port}で動いでます`);
});

