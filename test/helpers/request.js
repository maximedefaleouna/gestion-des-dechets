const http = require("http");

const makeRequest = (app, method, path) => {
  let payload;
  let query;

  const execute = () =>
    new Promise((resolve, reject) => {
      const server = app.listen(0, () => {
        const { port } = server.address();
        const search =
          query && Object.keys(query).length
            ? `?${new URLSearchParams(query).toString()}`
            : "";

        const req = http.request(
          {
            hostname: "127.0.0.1",
            port,
            path: `${path}${search}`,
            method,
            headers: {
              "Content-Type": "application/json",
            },
          },
          (res) => {
            let body = "";

            res.setEncoding("utf8");
            res.on("data", (chunk) => {
              body += chunk;
            });
            res.on("end", () => {
              server.close();

              if (!body) {
                resolve({ status: res.statusCode, body: {} });
                return;
              }

              try {
                resolve({ status: res.statusCode, body: JSON.parse(body) });
              } catch (error) {
                resolve({ status: res.statusCode, body });
              }
            });
          },
        );

        req.on("error", (error) => {
          server.close();
          reject(error);
        });

        if (payload !== undefined) {
          req.write(JSON.stringify(payload));
        }

        req.end();
      });
    });

  const chain = {
    send(data) {
      payload = data;
      return chain;
    },
    query(params) {
      query = params;
      return chain;
    },
    then(resolve, reject) {
      return execute().then(resolve, reject);
    },
    catch(reject) {
      return execute().catch(reject);
    },
  };

  return chain;
};

module.exports = (app) => ({
  get: (path) => makeRequest(app, "GET", path),
  post: (path) => makeRequest(app, "POST", path),
  put: (path) => makeRequest(app, "PUT", path),
  patch: (path) => makeRequest(app, "PATCH", path),
  delete: (path) => makeRequest(app, "DELETE", path),
});
