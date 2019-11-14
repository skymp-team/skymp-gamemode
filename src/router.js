class Router {
  constructor(listen, parent = null, routePrefix = '') {
    if (typeof listen !== 'function') {
      throw new TypeError('listen must be function');
    }

    this.listen = listen;
    this.parent = parent;
    this.routePrefix = routePrefix;
    this.postHandlers = [];
    this.getHandlers = [];
    if (!parent) {
      listen(async ctx => {
        let handlers = ctx.type === 'get' ? this.getHandlers : this.postHandlers;
        let found = false;
        for (let h of handlers) {
          if (ctx.route === h.route) {
            await h.callback(ctx);
            found = true;
            break;
          }
        }
        if (!found) {
          ctx.setError(`Handler not found for ${ctx.route} (${ctx.type})`);
        }
      });
    }
  }

  route(routePrefix) {
    let prefix = this.parent ? this._routeJoin(this.parent.routePrefix, routePrefix) : routePrefix;
    return new Router(this.listen, this, prefix);
  }

  post(route, callback) {
    if (this.parent) {
      this.parent.post(this._routeJoin(this.routePrefix, route), callback);
    }
    else {
      this.postHandlers.push({ route, callback });
    }
  }

  get(route, callback) {
    if (this.parent) {
      this.parent.get(this._routeJoin(this.routePrefix, route), callback);
    }
    this.getHandlers.push({ route, callback });
  }

  _routeJoin(...routes) {
    let res = '';
    routes.forEach(route => {
      res += route;
      while (res.length > 0 && res[res.length - 1] == '/') {
        res = res.slice(0, -1);
      }
      res += '/';
    });
    return res.slice(0, -1);
  }
};

module.exports = Router;
