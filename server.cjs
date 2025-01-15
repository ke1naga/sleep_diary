const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session'); // セッションを使うために追加
const app = express();
const port = 3000;
const bcrypt = require('bcryptjs');

const cors = require('cors');

require('dotenv').config();  // dotenvを読み込む

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// 非同期接続テスト
async function testConnection() {
  try {
    const [rows] = await connection.query('SELECT 1');
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
  secret: process.env.SESSION_SECRET,  // セッションの暗号化キー
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 3600000 // セッションの有効期限を1時間に設定
  }
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

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'ユーザー名とパスワードは必須です' });
  }

  try {
    // データベースからユーザー情報を取得
    const query = 'SELECT * FROM users WHERE username = ?';
    const [rows] = await connection.query(query, [username]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    const user = rows[0];

    // パスワードを比較
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'パスワードが一致しません' });
    }

    // セッションにログイン状態とユーザー情報を保存
    req.session.loggedIn = true;
    req.session.userId = user.id;
    req.session.username = user.username;

    // ログイン成功後に /graph.html にリダイレクト
    res.redirect('/graph.html');
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ error: 'ログインに失敗しました', message: error.message });
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
app.post('/saveOrUpdate', isAuthenticated, async(req, res) => {
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
    INSERT INTO sleep_info (date, value, mood, diary, user_id)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    value = VALUES(value),
    mood = VALUES(mood),
    diary = VALUES(diary);
  `;

  const userId = req.session.userId;

  let connection;
  try {
    const [result] = await connection.query(query, [formattedDate, value, mood, diary, userId]);
    console.log('データ保存または更新成功:', result);
    res.json({ message: 'データが保存または更新されました', result });
  } catch (error) {
    console.error('データベースエラー:', error);
    res.status(500).json({ error: 'データベースエラー', message: error.message });
  }
});

// データ取得エンドポイント
app.get('/getData', isAuthenticated, async (req, res) => {
  try {
    const [results] = await connection.query('SELECT * FROM sleep_info ORDER BY date ASC');
    res.json(results);
  } catch (error) {
    console.error('データ取得エラー:', error);
    res.status(500).json({ error: 'データ取得エラー', message: error.message });
  }
});


// 日付を基準にデータを取得するエンドポイント
app.get('/getDataByDate', isAuthenticated, async (req, res) => {
  const { date } = req.query;

  if (!date || !isValidDate(date)) {
    return res.status(400).json({ error: '無効な日付形式です' });
  }

  // 日付をフォーマットして統一
  const formattedDate = format(parseISO(date), 'yyyy-MM-dd');

  let connection;
  try {
    const query = 'SELECT * FROM sleep_info WHERE date = ?';
    connection = await connection.getConnection(); // 接続を取得
    const [results] = await connection.query(query, [formattedDate]);

    if (results.length === 0) {
      return res.status(404).json({ error: '指定された日付のデータは存在しません' });
    }

    res.json(results[0]); // 見つかったデータを返す
  } catch (error) {
    console.error('データ取得エラー:', error);
    res.status(500).json({ error: 'データ取得エラー', message: error.message });
  }finally{
    if (connection) connection.release(); // 接続を解放
  }
});

// 前後30日分のデータを取得するエンドポイント
app.get('/getDataInRange', isAuthenticated, async (req, res) => {
  const { date } = req.query;

  if (!date || !isValidDate(date)) {
    return res.status(400).json({ error: '無効な日付形式です' });
  }

  // 日付をフォーマットして基準日を設定
  const baseDate = parseISO(date);
  const startDate = format(new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'); // 基準日の30日前
  const endDate = format(new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');   // 基準日の30日後

  try {
    const query = 'SELECT * FROM sleep_info WHERE date BETWEEN ? AND ? ORDER BY date ASC';
    const [results] = await connection.query(query, [startDate, endDate]);

    res.json(results); // 前後15日間のデータを返す
  } catch (error) {
    console.error('データ取得エラー:', error);
    res.status(500).json({ error: 'データ取得エラー', message: error.message });
  }
});

//グラフの期間指定
app.get('/getDataInRange2', async(req, res) => {
  const { start, end } = req.query; // クエリパラメータから範囲を取得

  // 日付のバリデーション
  if (!start || !end) {
      return res.status(400).json({ error: '開始日または終了日が指定されていません' });
  }
  
  const query =`
  SELECT * FROM sleep_info
  WHERE date BETWEEN ? AND ?
  `;

  try {
    const [result] = await connection.execute(query, [start, end]);
    res.json(result); // フィルタリングしたデータを返す
  } catch (err) {
    console.error('データ取得エラー:', err);
    res.status(500).json({ error: 'データ取得エラー' });
  }
});


// サーバーを起動
app.listen(port, '0.0.0.0', () => {
  console.log(`http://0.0.0.0:${port}で動いでます`);
});

process.on('SIGINT', async () => {
  try {
    await connection.end(); // プール内のすべての接続を解放
    console.log('コネクションプールを閉じました');
    process.exit(0);
  } catch (err) {
    console.error('プール終了エラー:', err);
    process.exit(1);
  }
});
