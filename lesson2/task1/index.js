class TimersManager {
    constructor() {
        this.timers = [];
    }

    add() {

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

    validate(timer) {
        if (typeof timer.name !== 'string') {
            throw Error ('timer name should be string')
        }
        if (typeof timer.delay !== 'number') {
            throw Error ('timer delay should be number')
        }
        if (typeof timer.interval !== 'boolean') {
            throw Error ('timer interval should be boolean')
        }
        if (typeof timer.job !== 'function') {
            throw Error ('timer job should be function')
        }
    }
}
