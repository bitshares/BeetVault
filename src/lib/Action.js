export default class Action {

    constructor(_type = '', _payload = {}) {
        this.type = _type;
        this.payload = _payload;
    }

    static placeholder() {
        return new Action();
    }
    static fromJson(json) {
        return Object.assign(Action.placeholder(), json);
    }

    static error(payload) {
        return new Action('error', payload);
    }
}