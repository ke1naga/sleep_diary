// api/login.js
import { parse } from 'cookie';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    if (username === 'kei' && password === 'keikei') {
      res.setHeader('Set-Cookie', 'loggedIn=true; Path=/; HttpOnly');
      return res.status(200).json({ message: 'ログイン成功' });
    } else {
      return res.status(401).json({ error: 'ユーザー名またはパスワードが間違っています' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
