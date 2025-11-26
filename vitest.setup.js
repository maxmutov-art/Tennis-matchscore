class ChartStub {
  constructor() {
    return { destroy() {} };
  }
}

global.Chart = ChartStub;
