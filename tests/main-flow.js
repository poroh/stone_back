const chai     = require('chai');
const chaiHttp = require('chai-http');
const server   = require('../app');
const should   = chai.should();
const TestUser = require('./test-user');
const TestGame = require('./test-game');

chai.use(chaiHttp);

describe('Books', () => {
    beforeEach((done) => {
        done();         
    });

    describe('Main flow', () => {
        it('May process playing flow via API', (done) => {
            const user1 = new TestUser;
            const user2 = new TestUser;
            const game = new TestGame(user1, user2);
            user1.hello()
                .then(() => {
                    return user2.hello();
                })
                .then(() => {
                    return user1.findGame();
                })
                .then((res) => {
                    res.body.should.have.property('state').equal('searching');
                    return user2.findGame();
                })
                .then((res) => {
                    res.body.should.have.property('state').equal('playing');
                    return user1.findGame();
                })
                .then((res) => {
                    res.body.should.have.property('state').equal('playing');
                    return user1.game();
                })
                .then((res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('state').equal('play');
                    res.body.should.have.property('winner').equal(null);
                    res.body.should.have.property('enemy').include({
                        name: user2.name,
                        state: 'playing'
                    });
                    return user2.game();
                })
                .then((res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('state').equal('play');
                    res.body.should.have.property('winner').equal(null);
                    res.body.should.have.property('enemy').include({
                        name: user1.name,
                        state: 'playing'
                    });
                    return game.userChoice(user1, 'stone');
                })
                .then((res) => {
                    res.body.should.have.property('enemyMadeChoice').equal(false);
                    return user2.game()
                })
                .then((res) => {
                    res.body.should.have.property('enemyMadeChoice').equal(true);
                    return Promise.all([ game.userChoice(user2, 'paper'), user1.game() ]);
                })
                .then((results) => {
                    results.forEach((r) => {
                        r.body.should.have.property('state').equal('wait_ready');
                        r.body.should.have.property('round').equal(2);
                    });
                    return Promise.all([ user1.nextRound(), user2.nextRound() ]);
                })
                .then((results) => {
                    results.forEach((r) => {
                        r.body.should.have.property('round').equal(2);
                    });
                    return Promise.all([ user1.game(), user2. game() ]);
                })
                .then((results) => {
                    results.forEach((r) => {
                        r.body.should.have.property('state').equal('play');
                    });
                    return game.userChoices('snip', 'stone');
                }).then((results) => {
                    return game.nextRound();
                }).then(() => {
                    return game.userChoices('paper', 'snip');
                }).then(() => {
                    return Promise.all([ user1.game(), user2.game() ]);
                }).then((results) => {
                    results.forEach((r) => {
                        r.body.should.have.property('state').equal('wait_fatality');
                    });
                    return user2.fatality([ 'stone', 'stone', 'stone' ]);
                }).then(() => {
                    return Promise.all([ user1.game(), user2.game() ]);
                }).then((results) => {
                    results.forEach((r) => {
                        r.body.should.have.property('state').equal('fatality');
                        r.body.should.have.property('fatality').equal('stonehenge')
                    });
                    return game.over()
                }).then(() => {
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        });
    });
});

