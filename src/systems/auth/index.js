module.exports = (svr, router) => {
  let auth = router.route('auth');

  auth.post('login', async ctx => {
    let ac = await svr.findActor({ 'storage.password': ctx.body.pass, 'storage.name': ctx.body.name });
    if (!ac) {
      return ctx.setError('Not found');
    }
    await ctx.from.setActor(ac);
    await ac.setEnabled(true).setName(ctx.body.name);
  });

  auth.post('register', async ctx => {
    let ac = await svr.createActor()
      .setPos(-94445.5938, 60036.1406, -12741.3779)
      .setAngle(0, 0, 0)
      .setCellOrWorld(0x3c)
      .setEnabled(true)
      .setStorage({ password: ctx.body.pass, name: ctx.body.name })
      .setName(ctx.body.name)
      .setRaceMenuOpen(true)

    await ctx.from.setActor(ac);
  });

  auth.get('actor', async ctx => {
    let ac = await ctx.from.getActor();
    ctx.setResult(ac ? ac.getId() : null);
  });

  svr.on('userExit', async user => {
    let ac = await user.getActor();
    if (ac) {
      await ac.setEnabled(false);
    }
  });
};
