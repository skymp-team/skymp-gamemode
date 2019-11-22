let fs = require('fs');
let path = require('path');
let axios = require('axios');

async function createServer(masterUrl, serverOptions, frontEnd, localStorage) {
  let skympApi;
  let paths = ['/usr/lib/skymp-api.node', 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Skyrim\\skymp-api.node', 'skymp-api.node'];
  paths.forEach(p => {
    if (!skympApi && (fs.existsSync(p) || fs.existsSync(path.join('node_modules', p)))) {
      skympApi = require(p);
    }
  });
  let { RemoteServer } = skympApi;

  let master = axios.create({ baseURL: masterUrl, timeout: 5000 });

  let { serverId, devPassword, ip, gamemodesPort } = (await master.post('/servers', serverOptions)).data;
  localStorage.setItem('serverId', serverId);
  localStorage.setItem('devPassword', devPassword);

  let svr = new RemoteServer;

  await new Promise((resolve, reject) => {
    let options = { serverId, devPassword, ip, port: gamemodesPort, frontEnd };
    svr.connect(options);
    options.devPassword = '******';
    console.log('Connecting to', options);
    svr.on('connect', err => {
      err ? reject(err) : resolve();
    });
  });

  return svr;
};

module.exports = createServer;
