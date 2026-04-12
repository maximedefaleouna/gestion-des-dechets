const PasswordResetCode = require("../../src/modules/auth/auth.model");

const getSaveHooks = () =>
  PasswordResetCode.schema.s.hooks._pres
    .get("save")
    .map((hook) => hook.fn)
    .filter((fn) => fn.name === "updateTimestamp");

describe("auth.model", () => {
  it("updates the timestamp before save", async () => {
    const [updateTimestamp] = getSaveHooks();
    const doc = {
      updatedAt: new Date("2026-04-08T00:00:00.000Z"),
    };

    updateTimestamp.call(doc);

    expect(doc.updatedAt).toBeInstanceOf(Date);
    expect(doc.updatedAt.getTime()).toBeGreaterThan(
      new Date("2026-04-08T00:00:00.000Z").getTime(),
    );
  });
});
