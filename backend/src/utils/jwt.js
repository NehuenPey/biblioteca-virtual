const jwt = require("jsonwebtoken");

const generarToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

const verificarJWT = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = {
  generarToken,
  verificarJWT,
};
