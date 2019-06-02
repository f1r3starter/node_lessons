class TimersManager {
    constructor() {
        this.timers = [];
        this.logs = [];
        this.timerValidator = [
            ['name', name => typeof name === 'string', 'Timer name should be a string'],
            ['name', name => name !== '', 'Timer name could not be empty'],
            ['name', name => !this.timers.some(timer => timer.name === name), 'Timer with the same name already exists'],
            ['delay', delay => typeof delay === 'number', 'Timer delay should be a number'],
            ['delay', delay => delay > 0, 'Timer delay could not be less than 0 ms'],
            ['delay', delay => delay <= 5000, 'Timer delay could not be bigger than 5000 ms'],
            ['interval', interval => typeof interval === 'boolean', 'Timer interval should be boolean'],
            ['job', job => typeof job === 'function', 'Timer job should be a function'],
        ]
    }

    add(timer, ...timerArgs) {
        const errors = this.timerValidator
            .filter(([name, validator]) => !validator(timer[name]))
            .map(([, , error]) => error)
            .join("\n");
        if (errors) {
            throw new Error(`Something went wrong while adding new timer, please, check next errors:\n ${errors}`);
        }

        this.timers.push({timerArgs, ...timer});

        return this;
    }

    remove(timerName) {
        this.pause(timerName);
        this.timers = this.timers.filter(timer => timer.name !== timerName);
    }

    start() {
        const startedTimers = this.timers.some(timer => timer.hasOwnProperty('id'));
        if (startedTimers) {
            throw new Error('There are already started timers');
        }

        this.timers = this.timers.map(timer => this.resume(timer.name));

        const maxDelay = Math.max(...this.timers.map(timer => timer.delay));
        setTimeout(() => this.stop(), maxDelay + 10000);
    }

    stop() {
        this.timers = this.timers.map(timer => this.pause(timer.name));
    }

    pause(timerName) {
        const timer = this._findTimer(timerName);
        timer.interval ? clearInterval(timer.id) : clearTimeout(timer.id);
        delete timer.id;

        return timer;
    }

    resume(timerName) {
        const timer = this._findTimer(timerName);
        const timerId = timer.interval ? setInterval(TimersManager._log, timer.delay, this.logs, timer) : setTimeout(TimersManager._log, timer.delay, this.logs, timer);

        return {id: timerId, ...timer};
    }

    print() {
        console.log(this.logs);
    }

    _findTimer(timerName) {
        const timer = this.timers.find(timer => timer.name === timerName);
        if (!timer) {
            throw new Error('Timer does not exists');
        }

        return timer;
    }

    static _log(log, timer) {
        let entry = {
            name: timer.name,
            in: timer.timerArgs,
            out: undefined,
            created: new Date().toJSON(),
        };

        try {
            entry.out = timer.job(...timer.timerArgs);
        } catch (e) {
            entry.error = (({ name, message, stack }) => ({ name, message, stack }))(e);
        } finally {
            log.push(entry);
        }
    }
}


const manager = new TimersManager();

const t1 = {
    name: 't1',
    delay: 1000,
    interval: false,
    job: (a, b) => a + b
};
const t2 = {
    name: 't2',
    delay: 1000,
    interval: false,
    job: () => { throw new Error('We have a problem!') }
};
const t3 = {
    name: 't3',
    delay: 5000,
    interval: false,
    job: n => n
};
manager.add(t1, 1, 2); // 3
manager.add(t2); // undefined
manager.add(t3, 1); // 1
manager.start();
