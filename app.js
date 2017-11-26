const express      = require('express');
const cookieParser = require('cookie-parser');
const SessionDB    = require('./src/session-db');
const UserDB       = require('./src/user-db');
const SetupLog     = require('./src/log');

SetupLog();

const userDB    = new UserDB();
const sessionDB = new SessionDB(userDB); 
const app = express();

app.use(cookieParser());
app.use(express.static('www'));

app.get('/api/session/hello', function (req, res) {
    const token = req.cookies['token'];
    Promise.resolve()
        .then(() => {
              let session = sessionDB.findSession(token);
              if (!session) {
                  return sessionDB.newSession();
              }
              return session;
        }).then((session) => {
            return session.hello()
                .then((result) => {
                    const session = result.session;
                    res.cookie('token', session.token,
                               { maxAge: session.expires, httpOnly: true })
                        .send(result.user);
                })
        })
        .catch((error) => {
            console.error('hello error: ', error);
        });
});

app.post('/api/user/find-game', function (req, res) {
    const token = req.cookies['token'];
    const session = sessionDB.findSession(token);
    if (!session) {
        return res.status(403).send();
    }
    const user = session.user;
    res.send(user.findGame(req));
});

app.get('/api/game', function(req, res) {
    const token = req.cookies['token'];
    const session = sessionDB.findSession(token);
    if (!session) {
        return res.status(403).send();
    }
    const user = session.user;
    if (!user.game) {
        return res.status(404).send();
    }
    const game = user.game;
    res.send(game.json(user));
});

app.post('/api/game/move', function (req, res) {
    const user = findUser(req, res);
    if (!user)
        return;
    if (!user.game) {
        return res.status(404).send();
    }
    res.send(user.game.move(user, req.query.choice));
});

app.post('/api/game/next-round', function (req, res) {
    const user = findUser(req, res);
    if (!user)
        return;
    if (!user.game)
        return res.status(404).send();
    res.send(user.game.nextRound(user));
});

app.post('/api/game/fatality', function (req, res) {
    const user = findUser(req, res);
    if (!user)
        return;
    if (!user.game)
        return res.status(404).send();
    res.send(user.game.fatality(user, req.query.combination));
});

function findUser(req, res)
{
    const token = req.cookies['token'];
    const session = sessionDB.findSession(token);
    if (!session) {
        res.status(403).send();
        return null
    }
    return session.user;
}

app.listen(3000);
console.log("Started at port 3000");

module.exports = app;
