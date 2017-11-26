const chai     = require('chai');
const chaiHttp = require('chai-http');
const server   = require('../app');
const should   = chai.should();

chai.use(chaiHttp);

class TestUser {
    constructor() {
        this.agent = chai.request.agent(server);
    }

    hello() {
        return this.agent.get('/api/session/hello')
            .then((res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('name');
                res.body.should.have.property('state');
                res.should.have.cookie('token');
                this.name = res.body.name;
                return res;
            });
    }

    findGame() {
        return this.agent.post('/api/user/find-game')
            .then((res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('name').equal(this.name);
                return res;
            })
    }

    game() {
        return this.agent.get('/api/game')
    }

    choice(choice) {
        return this.agent.post('/api/game/move?choice=' + choice);
    }

    nextRound() {
        return this.agent.post('/api/game/next-round');
    }

    fatality(combination) {
        return this.agent.post('/api/game/fatality?combination=' + combination.join(','));
    }

}

module.exports = TestUser;
