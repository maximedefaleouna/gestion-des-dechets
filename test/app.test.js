const request = require("supertest");
const app = require("../src/app");

describe("app", () => {
  it("returns the home message", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.text).toBe("Projet Goupe 2");
  });

  it("returns the swagger specification", async () => {
    const response = await request(app).get("/api-docs.json");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("openapi");
  });

  it("returns 404 for unknown routes", async () => {
    const response = await request(app).get("/route-inconnue");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Route introuvable",
    });
  });
});
