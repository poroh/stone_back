const Game = require('./game');

class User {
    constructor(name, db) {
        this.db   = db;
        this.name = name;
        this.state = 'idle'; // idle | searching | playing
        this.sessions = [];  // user sessions
        this.game = null;    // game that user participates 
    }
    json() {
        return {
            name: this.name,
            state: this.state
        };
    }

    gameOver() {
        this.state = 'idle';
        this.game  = null;
    }

    findGame() {
        switch (this.state) {
        case 'idle':
            var peer = this.db.findSearching(this);
            if (peer) {
                new Game(this, peer);
                this.state = 'playing';
                peer.state = 'playing';
                this.db.updated(this);
                this.db.updated(peer);
            } else {
                this.state = 'searching';
                this.db.updated(this);
            }
            break
        case 'searching':
            break;
        case 'playing':
            break;
        }
        return this.json();
    }
}

module.exports = User;
