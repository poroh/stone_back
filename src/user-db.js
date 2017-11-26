const RandomName = require('random-name');
const User       = require('./user');

function randomName()
{
    return `${RandomName.first()} ${RandomName.last()}`;
}

class UserDB {
    constructor() {
        this.userByName = {};
        this.searching = null;
    }

    newAnonymous() {
        return this.generateUniqueName()
            .then((name) => {
                return new User(name, this);
            })
    }

    generateUniqueName() {
        let name = randomName();
        while (this.hasOwnProperty(name)) {
            name = randomName();
        }
        return Promise.resolve(name);
    }

    findSearching() {
        if (!this.searching) {
            return null;
        }
        const searching = this.searching;
        this.searching = null;
        return searching;
    }

    updated(user) {
        if (user.state === 'searching') {
            this.searching = user;
        } else if (this.searching === user && user.state !== 'searching') {
            this.searching = null;
        }
    }
}

module.exports = UserDB;
