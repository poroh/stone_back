const Session = require('./session');

class SessionDB {
    constructor(userDB) {
        this.tokenToSession = {};
        this.userDB = userDB;
    }

    findSession(token) {
        if (this.tokenToSession.hasOwnProperty(token)) {
            return this.tokenToSession[token];
        }
        return null;
    }
    newSession() {
        const session = new Session(this.userDB);
        return session.generateToken()
            .then((token) => {
                this.tokenToSession[token] = session;
                return session;
            });
    }
    
}

module.exports = SessionDB;
