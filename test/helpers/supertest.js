const http = require("http");
const { URLSearchParams } = require("url");

const buildQueryString = (query) => {
  if (!query || Object.keys(query).length === 0) {
    return "";
  }

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    params.append(key, String(value));
  });

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
};

const parseBody = (rawBody, headers) => {
  if (!rawBody) {
    return undefined;
  }

  const text = rawBody.toString("utf8");
  if (!text) {
    return undefined;
  }

  const contentType = String(headers["content-type"] || "");
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return text;
    }
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
};

class TestRequest {
  constructor(app, method, path) {
    this.app = app;
    this.method = method;
    this.path = path;
    this.body = undefined;
    this.queryParams = undefined;
  }

  send(body) {
    this.body = body;
    return this;
  }

  query(params) {
    this.queryParams = params;
    return this;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }

  async execute() {
    const server = http.createServer(this.app);

    await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    const { port } = server.address();
    const pathWithQuery = `${this.path}${buildQueryString(this.queryParams)}`;
    const payload =
      this.body === undefined ? null : Buffer.from(JSON.stringify(this.body));

    const response = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: pathWithQuery,
          method: this.method,
          headers: payload
            ? {
                "content-type": "application/json",
                "content-length": payload.length,
              }
            : undefined,
        },
        (res) => {
          const chunks = [];

          res.on("data", (chunk) => chunks.push(chunk));
          res.on("end", () => {
            const rawBody = Buffer.concat(chunks);
            resolve({
              status: res.statusCode,
              headers: res.headers,
              body: parseBody(rawBody, res.headers),
              text: rawBody.toString("utf8"),
            });
          });
        },
      );

      req.on("error", reject);

      if (payload) {
        req.write(payload);
      }

      req.end();
    });

    await new Promise((resolve) => server.close(resolve));

    return response;
  }
}

const request = (app) => ({
  get: (path) => new TestRequest(app, "GET", path),
  post: (path) => new TestRequest(app, "POST", path),
  put: (path) => new TestRequest(app, "PUT", path),
  patch: (path) => new TestRequest(app, "PATCH", path),
  delete: (path) => new TestRequest(app, "DELETE", path),
});

module.exports = request;
