let fs = require('fs');
let path = require('path');
let http = require('http');
let axios = require('axios');

function getMyPublicIp() {
  let options = { host: 'ipv4bot.whatismyipaddress.com', port: 80, path: '/' };
  return new Promise((resolve, reject) => {
    http.get(options, (res) => {
      res.on('data', (buf) => { resolve(buf.toString('ascii')); });
    }).on('error', reject);
  });
};

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

  let myIp = await getMyPublicIp();
  await new Promise((resolve, reject) => {
    let options = { serverId, devPassword, ip, port: gamemodesPort, frontEnd };

    if (myIp === options.ip) {
      options.ip = '127.0.0.1';
    }

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
