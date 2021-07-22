module.exports = (err) => {
  const error = new Error();
  error.status = err.status;
  error.message = err.message;
  return error;
};
