let fs = require('fs');

async function createServer(masterUrl, serverOptions, frontEnd, localStorage) {
  let skympApi;
  let paths = ['C:/projects/skymp-build/pack/skymp-api.node', 'skymp-api.node'];
  paths.forEach(p => {
    if (!skympApi && fs.existsSync(p)) {
      skympApi = require(p);
    }
  });
  let { RemoteServer } = skympApi;

  let axios = require('axios');
  let master = axios.create({ baseURL: masterUrl, timeout: 5000 });

  let { serverId, devPassword, ip, gamemodesPort } = (await master.post('/servers', serverOptions)).data;
  localStorage.setItem('serverId', serverId);
  localStorage.setItem('devPassword', devPassword);

  let svr = new RemoteServer;

  await new Promise((resolve, reject) => {
    svr.connect({ serverId, devPassword, ip, port: gamemodesPort, frontEnd });
    svr.on('connect', err => {
      err ? reject(err) : resolve();
    });
  });

  return svr;
};

module.exports = createServer;
