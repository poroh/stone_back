const crypto = require('crypto');

function generateToken()
{
    return new Promise(function(resolve, reject) {
        crypto.randomBytes(48, function(err, buffer) {
            if (err) {
                return reject(err);
            }
            return resolve(buffer.toString('hex'));
        });
    })
}

class Session {
    constructor(userDB) {
        this.userDB  = userDB;
        this.user    = null;
        this.token   = null;
        this.expires = 5*365*24*3600 * 1000; 
    }

    generateToken() {
        return generateToken()
            .then((token) => {
                this.token = token;
                return token;
            });
    }

    json() {
        return {
            token: this.token,
            expires: this.expires
        }
    }

    hello() {
        let promise = null;
        if (!this.user) {
            promise = this.userDB.newAnonymous();
        } else {
            promise = Promise.resolve(this.user);
        }
        return promise
            .then((User) => {
                this.user = User;
                return {
                    session: this.json(),
                    user: this.user.json()
                };
            });
    }
}

module.exports = Session;
