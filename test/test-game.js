const chai   = require('chai');
const should = chai.should();

class TestGame {
    constructor(user1, user2) {
        this.users = [ user1, user2 ];
        this.gameStates = [ null, null ];
    }

    userChoice(user, choice) {
        const index = this.index(user);
        const enemyIndex = (index+1) % 2;
        let   result = null;
        return user.choice(choice)
            .then((res) => {
                this.checkGameJSON(res);
                this.gameStates[index] = res.body;
                result = res;
                return this.users[(index+1) % 2].game();
            })
            .then((res) => {
                this.checkGameJSON(res);
                this.gameStates[enemyIndex] = res.body;
                this.checkGameConsistency();
                return result;
            });
    }

    index(user) {
        const index = this.users.indexOf(user);
        if (index < 0)
            return null;
        return index;
    }

    checkGameJSON(res) {
        res.should.have.status(200);
        res.body.should.be.a('object');
        res.body.should.have.keys('state',
                                  'fatality',
                                  'enemy',
                                  'myChoice',
                                  'enemyMadeChoice',
                                  'round',
                                  'results',
                                  'winner');
    }

    nextRound() {
        return Promise.all(
            this.users.map((user) => user.nextRound())
        );
    };
    userChoices(user1Choice, user2Choice) {
        let results = [];
        return [ user1Choice, user2Choice ].reduce((promise, choice, index) => {
            return promise.then(() => this.userChoice(this.users[index], choice))
                .then((res) => results.push(res));
        }, Promise.resolve())
            .then(() => results);
    }
    over() {
        return Promise.all(
            this.users.map((user) => user.nextRound())
        );
    }

    checkGameConsistency() {
        const g1 = this.gameStates[0];
        const g2 = this.gameStates[1];
        const u1 = this.users[0];
        const u2 = this.users[1];
        g1.should.have.property('enemy').include({ name: u2.name });
        g2.should.have.property('enemy').include({ name: u1.name });
        g1.should.have.property('state').equal(g2.state).oneOf([ 'play', 'wait_ready', 'wait_fatality', 'fatality']);
        g1.should.have.property('results').an('array').to.have.lengthOf(g2.results.length);
        for (var i = 0; i < g1.results.length; ++i) {
            const r1 = g1.results[i];
            const r2 = g2.results[i];
            switch (r1.winner) {
            case 'me':
                r2.should.have.property('winner').equal('enemy');
                break;
            case 'enemy':
                r2.should.have.property('winner').equal('me');
                break;
            case 'draw':
                r2.should.have.property('winner').equal('draw');
                break;
            }
            const possibleChoices = [ 'stone', 'paper', 'snip']
            r1.should.have.property('myChoice').equal(r2.enemyChoice).oneOf(possibleChoices);
            r1.should.have.property('enemyChoice').equal(r2.myChoice).oneOf(possibleChoices);
        }
    }
}

module.exports = TestGame;
