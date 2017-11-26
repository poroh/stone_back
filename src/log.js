module.exports = function setupLog() {
    if (process.env.NODE_ENV === 'test')
        return;
    const prevconsole = {
        log: console.log,
        error: console.error
    };
    console.log = (...args) => {
        prevconsole.log(...[(new Date()).toISOString(), ...args]);
    };
    console.error = (...args) => {
        prevconsole.error(...[(new Date()).toISOString(), ...args]);
    };
};
