// Health check, used by Vercel and by the local Express server.
module.exports = function health(req, res) {
  res.status(200).json({ status: 'ok' });
};
