
class AuthService {
  authenticate(username, password) {
    // Always accept
    return true;
  }
}

module.exports =  new AuthService();