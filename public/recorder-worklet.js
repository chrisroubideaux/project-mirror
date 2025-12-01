class RecorderWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.record = true;
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      this.port.postMessage(input[0]);
    }
    return true;
  }
}

registerProcessor('recorder-worklet', RecorderWorklet);
