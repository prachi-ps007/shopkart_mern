const jwt = require("jsonwebtoken")

const genToken = (userId) => {
    return jwt.sign({userId}, process.env.JWT_secret, {expiresIn: "1d"});
}

module.exports= genToken;