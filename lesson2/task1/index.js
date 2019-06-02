class TimersManager {
    constructor() {
        this.timers = [];
        this.timerValidator = [
            ['name', name => typeof name === 'string', 'Timer name should be a string'],
            ['name', name => name !== '', 'Timer name could not be empty'],
            ['name', name => !this.timers.some(timer => timer.name === name), 'Timer with the same name already exists'],
            ['delay', delay => typeof delay === 'number' , 'Timer delay should be a number'],
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
        const timerId = timer.interval ? setInterval(timer.job, timer.delay, ...timer.timerArgs) : setTimeout(timer.job, timer.delay, ...timer.timerArgs);

        return {id: timerId, ...timer};
    }

    _findTimer(timerName) {
        const timer = this.timers.find(timer => timer.name === timerName);
        if (!timer) {
            throw new Error('Timer does not exists');
        }

        return timer;
    }
}
