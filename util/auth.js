exports.checkForToken = (request) => {
  let token;
  if (request.get("Authorization")) {
    token = request.get("Authorization").split(" ")[1];
  } else if (request.cookies.token) {
    token = request.cookies.token;
  } else {
    token = null;
  }
  return token;
};
