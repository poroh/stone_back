const WinMatrix = {
    stone: "snip",
    snip:  "paper",
    paper: "stone"
}

class Game {
    constructor(User1, User2) {
        this.users = [ User1, User2 ];
        User1.game = this;
        User2.game = this;
        this.results = [];
        this.choices = [ null, null ];
        this.state = 'play'; // play | wait_ready | wait_fatality | fatality
        this.fatalityId = null;
        this.winner   = null;
        this.roundTimer = null;
        this.log('is created');
    }

    destroy() {
        this.log('game over');
        this.users.forEach((user) => {
            user.gameOver();
        });
    }

    json(user) {
        const index = this.index(user);
        const enemy = this.other(user);
        return {
            state:    this.state,
            fatality: this.fatalityId,
            myChoice: this.choices[index],
            winner:   this.winner === user ? 'me' : this.winner === null ? null : 'enemy',
            enemy:    enemy.json(),
            enemyMadeChoice: this.enemyMadeChoice(user),
            round:    this.results.length+1,
            results:  this.jsonResults(user)
        }
    }
    
    move(user, choice)
    {
        if (this.state !== 'play') {
            this.log('ignore move in not play state');
            return this.json(user);
        }

        if (!WinMatrix.hasOwnProperty(choice) && choice !== 'timeout')
            return this.json(user);
        const index = this.index(user);
        if (this.choices[index] === null) { 
            this.choices[index] = choice;
        }
        this.log('user', user.name, 'has choosen', choice);
        this.updateResults();
        return this.json(user);
    }

    jsonResults(user)
    {
        const index = this.index(user);
        return this.results.map((r) => {
            const winnerIdx = findWinnerIdx(r.choices);
            const winner = winnerIdx === null ? "draw" :
                  winnerIdx === index ? "me" : "enemy";
            return {
                myChoice:    r.choices[index],
                enemyChoice: r.choices[(index + 1) % 2],
                winner:      winner     
            }
        });
    }

    fatality(user, combination)
    {
        if (this.state !== 'wait_fatality') {
            this.log('unexpected fatality: ', user.name);
            return this.json(user);
        }
        if (this.winner !== user) {
            this.log('ignore fatality from not winner:', user.name);
            return this.json(user);
        }
        this.fatalityId = decodeFatalityCombination(combination);
        this.log('fatality is', this.fatalityId);
        this.state = 'fatality';
        return this.json(user);
    }

    updateResults()
    {
        const winnerIdx = findWinnerIdx(this.choices);
        if (winnerIdx === undefined)
            return;

        if (this.roundTimer)
            clearTimeout(this.roundTimer);
        this.roundTimer = null;

        this.results.push({ choices: this.choices.slice(0) });
        if (this.results.length < 3) {
            this.log('wait next round'); 
            this.state = 'wait_ready';
            return;
        }
        let wins = [ 0, 0 ];
        for (let i = 0; i < this.results.length; ++i) {
            const roundWinnerIdx = findWinnerIdx(this.results[i].choices);
            if (roundWinnerIdx !== null)
                wins[roundWinnerIdx]++;
        }
        if (wins[0] === wins[1]) {
            this.state = 'wait_ready';
            return;
        }
        const max = Math.max.apply(null, wins);
        if (max < 3) {
            this.state = 'wait_ready';
            return;
        }
        this.winner = max === wins[0] ? this.users[0] : this.users[1];
        this.log('the winner is', this.winner.name);
        this.state = 'wait_fatality';
    }

    nextRound(user) {
        if (this.state !== 'wait_ready' && this.state !== 'fatality')
            return this.json(user);
        const index = this.index(user);
        this.choices[index] = null;
        if (this.choices[0] === null && this.choices[1] === null) {
            if (this.state == 'fatality') {
                this.destroy();
                return { state: 'over' };
            } else {
                this.state = 'play';
            }
        }
        return this.json(user);
    }

    other(user) {
        const index = this.index(user);
        return this.users[(index + 1) % 2];
    }

    enemyMadeChoice(user) {
        const index = this.index(user);
        return this.choices[(index+1) % 2] !== null;
    }

    index(user) {
        if (user === this.users[0])
            return 0;
        if (user === this.users[1])
            return 1;
        throw new Error('Unknown user ' + user.name);
    }

    startRound() {
        if (this.roundTimer !== null)
            clearTimeout(this.roundTimer);
        this.roundTimer = setTimeout(() => this.roundTimeoutAlarm(), 10000);
    }

    roundTimeoutAlarm() {
        this.roundTimeout = null;
        if (this.state !== 'play')
            return;
        for (var i = 0; i < this.choices.length; ++i) {
            if (this.choices[i] === null)
                this.choices[i] = 'timeout';
        }
        this.updateResults();
    }
    log(...args) {
        console.log(...[`game ${this.users[0].name} vs ${this.users[1].name} (${this.state}):`, ...args]);
    }
 
}

function findWinnerIdx(choices)
{
    if (choices[0] === null || choices[1] === null)
        return undefined;

    if (choices[0] === choices[1])
        return null;

    if (choices[0] === 'timeout') {
        return 1;
    }
    if (choices[1] === 'timeout') {
        return 0;
    }

    if (WinMatrix[choices[0]] === choices[1]) {
        return 0;
    }
    return 1;
}

function decodeFatalityCombination(combinaiton)
{
    switch (combinaiton) {
    case 'stone,stone,stone':
        return 'stonehenge';
    default:
        return 'miss';
    }
}

module.exports = Game;
