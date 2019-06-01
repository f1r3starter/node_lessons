class TimersManager {
    constructor() {
        this.timers = [];
        this.timerValidator = [
            ['name', name => typeof name === 'string', 'Timer name should be a string'],
            ['name', name => name !== '', 'Timer name could not be empty'],
            ['name', name => !this.timers.some(timer => timer.name === name), 'Timer with the same name already exists'],
            ['delay', delay => typeof delay === 'number' , 'Timer delay should be a number'],
            ['delay', delay => delay > 0, 'Timer delay could not be less than 0 ms'],
            ['delay', delay => delay < 5000, 'Timer delay could not be bigger than 5000 ms'],
            ['interval', interval => typeof interval === 'boolean', 'Timer interval should be boolean'],
            ['job', job => typeof job === 'function', 'Timer job should be a function'],
        ]
    }

    add(timer, ...timerArgs) {
        let errors = this.timerValidator
            .filter(([name, validator]) => !validator(timer[name]))
            .map(([, , error]) => error)
            .join("\n");
        if (errors) {
            throw new Error(`Something went wrong while adding new timer, please, check next errors:\n ${errors}`);
        }

        this.timers.push({timerArgs, ...timer});

        return this;
    }

    remove() {

    }

    start() {

    }

    stop() {

    }

    pause() {

    }

    resume() {

    }
}
