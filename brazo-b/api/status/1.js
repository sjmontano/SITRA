const revoked = [];
export default function handler(req, res) {
  return res.status(200).json({ revoked });
}
