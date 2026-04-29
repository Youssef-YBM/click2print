module.exports = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Click2Print API is running!',
    timestamp: new Date().toISOString()
  });
};