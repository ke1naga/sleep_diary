// api/logout.js
export default function handler(req, res) {
    if (req.method === 'GET') {
      res.setHeader('Set-Cookie', 'loggedIn=; Path=/; Max-Age=0; HttpOnly');
      return res.status(200).json({ message: 'ログアウト成功' });
    } else {
      res.status(405).json({ error: 'Method Not Allowed' });
    }
  }
  