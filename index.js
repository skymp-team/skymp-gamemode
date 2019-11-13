let fs = require('fs');
let recursive = require("recursive-readdir");
let { RemoteServer } = require('C:/projects/skymp-build/pack/skymp-api.node');

let svr = new RemoteServer();

let frontDir = 'front';
recursive(frontDir, function (err, files) {
  if (err) {
    return console.error(err);
  }

  let frontEnd = {};

  files.forEach(f => {
    let key = f.substr(frontDir.length + 1);
    frontEnd[key] = fs.readFileSync(f);
  });
  console.log({frontEnd})

  svr.connect({
    serverId: 'local_win32_test_server',
    devPassword: 'qwerty',
    ip: '127.0.0.1',
    port: 7000,
    frontEnd
  });
});

require('./front/lib/skympRequester');
let listen = global.skympRequest.createRequestListener({
  send: (target, customPacket) => {
    target.sendCustomPacket(customPacket);
  },
  receive: () => {
    return new Promise(resolve => {
      svr.once('userCustomPacket', (user, packet) => {
        resolve({ from: user, customPacket: packet });
      });
    });
  }
});

listen(async ctx => {
  if (ctx.route === 'login') {
    let ac = await svr.findActor({ 'storage.password': ctx.body.pass, 'storage.name': ctx.body.name });
    if (!ac) {
      throw new Error('Not found');
    }
    await ctx.from.setActor(ac);
    await ac.setEnabled(true).setName(ctx.body.name);
  }

  if (ctx.route === 'register') {
    let ac = await svr.createActor()
      .setPos(-94445.5938, 60036.1406, -12741.3779)
      .setAngle(0, 0, 0)
      .setCellOrWorld(0x3c)
      .setEnabled(true)
      .setStorage({ password: ctx.body.pass, name: ctx.body.name })
      .setName(ctx.body.name)
      .setRaceMenuOpen()

    await ctx.from.setActor(ac);
  }
});

svr.on('connect', (err) => {
  if (err) {
    return console.error('RemoteServer failed to connect:', err);
  }
  console.log('Connected to the RemoteServer');
});


svr.on('userEnter', async (user) => {
});

svr.on('userExit', async (user) => {
  let ac = await user.getActor();
  if (ac) {
    await ac.setEnabled(false);
  }
});
