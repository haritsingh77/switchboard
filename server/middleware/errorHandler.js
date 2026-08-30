function errorHandler(err, req, res, next) {
  console.log(err.message);
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid id format" });
  }
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Something went wrong" });
}

module.exports = errorHandler;
