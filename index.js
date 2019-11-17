let fs = require('fs');
let commander = require('commander');
let LocalStorage = require('node-localstorage').LocalStorage;
let createServer = require('./src/createServer');
let getFrontEnd = require('./src/getFrontEnd');
let Router = require('./src/router');
let skympRequest = require('./front/lib/skympRequester');

commander
  .option('-m, --master [url]', 'SkyMP master server URL', 'http://master.skymp.ru:3000')
  .option('-p, --maxPlayers [n]', 'Players online limitation', '5')
  .version(require('./package.json').version);
commander.parse(process.argv);

let localStorage = new LocalStorage('./local_storage');

async function main() {
  let frontEnd = await getFrontEnd('front');
  let svrOptions = { maxPlayers: parseInt(commander.maxPlayers) };
  if (localStorage.getItem('serverId')) {
    svrOptions.serverId = localStorage.getItem('serverId');
  }
  if (localStorage.getItem('devPassword')) {
    svrOptions.devPassword = localStorage.getItem('devPassword');
  }

  let svr = await createServer(commander.master, svrOptions, frontEnd, localStorage);

  let state = { customPackets: [] };
  svr.on('userCustomPacket', (from, customPacket) => state.customPackets.push({ from, customPacket }));
  let listen = skympRequest.createRequestListener({
    send: (target, customPacket) => {
      target.sendCustomPacket(customPacket);
    },
    receive: async () => {
      while (1) {
        await new Promise(r => setImmediate(r));
        if (state.customPackets.length) {
          return state.customPackets.shift();
        }
      }
    }
  });
  let router = new Router(listen);


  let systemsDir = './src/systems';
  fs.readdirSync(systemsDir).forEach(f => require(systemsDir + '/' + f)(svr, router));
};

main().catch(e => {
  console.error('Unhandled exception in main():');
  console.error(e);
  if (typeof e !== 'string') {
    console.error(e.toString());
  }
});
