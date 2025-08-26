const userCheckauthenticationToken = require("./auth");

// Alias for the authentication middleware
const checkAuthentication = userCheckauthenticationToken;

module.exports = { checkAuthentication };
