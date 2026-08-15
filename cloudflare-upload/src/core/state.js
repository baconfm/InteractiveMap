export class StateStore {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.listeners = new Set();
  }

  getState() { return { ...this.state }; }

  setState(patch) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
