function createRequestSource(options) {
  let idPrefix = Date.now() + '-' + Math.random() + '-';
  let idGenerator = {
    generate() {
      if (!this.id) this.id = 0;
      return ++this.id;
    }
  };

  if (typeof options.send !== 'function') {
    throw new TypeError('options.send(target, customPacket) must be function');
  }
  if (typeof options.receive !== 'function') {
    throw new TypeError('options.receive(id) must be function');
  }
  return (requestOptions) => {
    let { target, body, route, timeout, type } = requestOptions;
    if (!body) body = {};
    if (!timeout) timeout = 15000;
    if (!type) type = 'post';

    let idSuffix = idGenerator.generate();
    let id = idPrefix + idSuffix;

    let runRequest = async () => {
      await options.send(target, { id, body, route, type });

      let startMoment = Date.now();
      let timeRemaining = Math.max(0, startMoment + timeout - Date.now());
      let raceResult = await Promise.race([
        options.receive(id),
        new Promise(r => setTimeout(r, timeRemaining, 'expired!'))
      ]);
      if (raceResult === 'expired!') {
        throw new Error(`timeout ${timeout}ms expired for route ${route}`);
      }
      if (typeof raceResult === 'object' && raceResult.id === id) {
        if (raceResult.error) throw new Error(raceResult.error);
        return raceResult.body;
      }
    }
    return runRequest();
  };
};

function createRequestListener(options) {
  if (typeof options.send !== 'function') {
    throw new TypeError('options.send(target, customPacket) must be function');
  }
  if (typeof options.receive !== 'function') {
    throw new TypeError('options.receive() must be function');
  }

  let listener = async (asyncHandler) => {
    while (1) {
      let { from, customPacket } = await options.receive();
      let { id, body, route, type } = customPacket;
      let responseCustomPacket = { id };
      let setError = str => responseCustomPacket.error = str;
      let setResult = any => responseCustomPacket.body = any;
      let ctx = { from, body, route, type, setError, setResult };
      asyncHandler(ctx)
      .then(() => {
        options.send(from, responseCustomPacket);
      })
      .catch((e) => {
        console.error(`Error in ${route}`, e);
        responseCustomPacket.body = undefined;
        responseCustomPacket.error = 'Internal server error';
        options.send(from, responseCustomPacket);
      });
    }
  };
  return listener;
};

let g;
try {
  g = module.exports;
}
catch(e) {
  window.skympRequest = {};
  g = window.skympRequest;
}
g.createRequestListener = createRequestListener;
g.createRequestSource = createRequestSource;
