import app from '@/server/app';
import { NextRequest } from 'next/server';

async function handler(req: NextRequest) {
  return new Promise<Response>(async (resolve) => {
    const url = new URL(req.url);

    // Extract request headers into lowercased map
    const headersObj: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value;
    });

    // Extract request body safely
    let body: any = {};
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        const text = await req.text();
        if (text) {
          try {
            body = JSON.parse(text);
          } catch {
            body = text;
          }
        }
      } catch {
        body = {};
      }
    }

    // Extract URL query parameters
    const query: Record<string, string> = {};
    url.searchParams.forEach((val, key) => {
      query[key] = val;
    });

    const listeners: Record<string, Function[]> = {};

    const reqMock: any = {
      method: req.method,
      url: url.pathname + url.search,
      originalUrl: url.pathname + url.search,
      path: url.pathname,
      query,
      params: {},
      headers: headersObj,
      body,
      ip: headersObj['x-forwarded-for'] || '127.0.0.1',
      socket: { remoteAddress: headersObj['x-forwarded-for'] || '127.0.0.1' },
      connection: { remoteAddress: headersObj['x-forwarded-for'] || '127.0.0.1' },
      readable: false,
      pipes: [],
      pipe(dest: any) {
        return dest;
      },
      _readableState: {
        pipes: [],
        flowing: false,
        ended: true,
        endEmitted: true,
        length: 0,
      },
      header(name: string) {
        return headersObj[name.toLowerCase()];
      },
      get(name: string) {
        return headersObj[name.toLowerCase()];
      },
      on(event: string, cb: Function) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(cb);
        if (event === 'end' || event === 'close') {
          process.nextTick(() => cb());
        }
        return reqMock;
      },
      once(event: string, cb: Function) {
        reqMock.on(event, cb);
        return reqMock;
      },
      emit(event: string, ...args: any[]) {
        if (listeners[event]) {
          listeners[event].forEach((cb) => cb(...args));
        }
        return true;
      },
      removeListener(event: string, cb: Function) {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter((fn) => fn !== cb);
        }
        return reqMock;
      },
    };

    runExpress(app, reqMock, resolve);
  });
}

function runExpress(app: any, reqMock: any, resolve: (res: Response) => void) {
  let statusCode = 200;
  let headersSent = false;
  let isResolved = false;
  const rawHeaders: Record<string, string | string[]> = {};
  const resListeners: Record<string, Function[]> = {};

  const finish = (body: any, defaultContentType?: string) => {
    if (isResolved) return;
    isResolved = true;
    headersSent = true;

    if (defaultContentType && !resMock.getHeader('content-type')) {
      resMock.setHeader('content-type', defaultContentType);
    }

    const responseHeaders = new Headers();
    for (const [key, val] of Object.entries(rawHeaders)) {
      if (Array.isArray(val)) {
        val.forEach((v) => responseHeaders.append(key, v));
      } else if (val !== undefined && val !== null) {
        responseHeaders.set(key, String(val));
      }
    }

    resMock.emit('finish');
    resMock.emit('close');

    resolve(new Response(body, { status: statusCode, headers: responseHeaders }));
  };

  const resMock: any = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },
    get headersSent() {
      return headersSent;
    },
    setHeader(name: string, value: string | string[]) {
      rawHeaders[name.toLowerCase()] = value;
      return resMock;
    },
    getHeader(name: string) {
      return rawHeaders[name.toLowerCase()];
    },
    removeHeader(name: string) {
      delete rawHeaders[name.toLowerCase()];
      return resMock;
    },
    hasHeader(name: string) {
      return Object.prototype.hasOwnProperty.call(rawHeaders, name.toLowerCase());
    },
    getHeaders() {
      return { ...rawHeaders };
    },
    header(name: string, value?: any) {
      if (value !== undefined) {
        return resMock.setHeader(name, value);
      }
      return resMock.getHeader(name);
    },
    set(name: string, value?: any) {
      if (value !== undefined) {
        return resMock.setHeader(name, value);
      }
      return resMock.getHeader(name);
    },
    get(name: string) {
      return resMock.getHeader(name);
    },
    status(code: number) {
      statusCode = code;
      return resMock;
    },
    sendStatus(code: number) {
      statusCode = code;
      return resMock.send(String(code));
    },
    json(data: any) {
      const jsonString = JSON.stringify(data);
      finish(jsonString, 'application/json');
      return resMock;
    },
    send(data: any) {
      if (typeof data === 'object' && data !== null && !Buffer.isBuffer(data)) {
        return resMock.json(data);
      }
      finish(data ?? '', 'text/plain; charset=utf-8');
      return resMock;
    },
    end(data?: any) {
      finish(data ?? '', 'text/plain; charset=utf-8');
      return resMock;
    },
    write() {
      return true;
    },
    writeHead(code: number, headersObj?: Record<string, any>) {
      statusCode = code;
      if (headersObj) {
        for (const [k, v] of Object.entries(headersObj)) {
          resMock.setHeader(k, v);
        }
      }
      return resMock;
    },
    redirect(urlOrStatus: string | number, urlStr?: string) {
      if (typeof urlOrStatus === 'number') {
        statusCode = urlOrStatus;
        resMock.setHeader('Location', urlStr || '/');
      } else {
        statusCode = 302;
        resMock.setHeader('Location', urlOrStatus);
      }
      finish('', 'text/plain; charset=utf-8');
      return resMock;
    },
    type(t: string) {
      resMock.setHeader('content-type', t);
      return resMock;
    },
    contentType(t: string) {
      resMock.setHeader('content-type', t);
      return resMock;
    },
    on(event: string, cb: Function) {
      if (!resListeners[event]) resListeners[event] = [];
      resListeners[event].push(cb);
      return resMock;
    },
    once(event: string, cb: Function) {
      resMock.on(event, cb);
      return resMock;
    },
    emit(event: string, ...args: any[]) {
      if (resListeners[event]) {
        resListeners[event].forEach((cb) => cb(...args));
      }
      return true;
    },
    removeListener(event: string, cb: Function) {
      if (resListeners[event]) {
        resListeners[event] = resListeners[event].filter((fn) => fn !== cb);
      }
      return resMock;
    },
  };

  try {
    app(reqMock, resMock);
  } catch (err: any) {
    if (!isResolved) {
      statusCode = 500;
      finish(JSON.stringify({ success: false, error: err.message || 'Internal Server Error' }), 'application/json');
    }
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };

