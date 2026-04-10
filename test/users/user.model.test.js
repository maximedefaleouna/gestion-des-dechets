const bcrypt = require("bcryptjs");

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const User = require("../../src/modules/users/user.model");

const getSaveHooks = () =>
  User.schema.s.hooks._pres
    .get("save")
    .map((hook) => hook.fn)
    .filter((fn) => fn.name === "savePassword" || fn.name === "updateTimestamp");

describe("user.model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hashes the password when it is modified", async () => {
    const [savePassword] = getSaveHooks();
    const doc = {
      password: "plain-password",
      isModified: jest.fn().mockReturnValue(true),
    };

    bcrypt.hash.mockResolvedValue("hashed-password");

    await savePassword.call(doc);

    expect(bcrypt.hash).toHaveBeenCalledWith("plain-password", 10);
    expect(doc.password).toBe("hashed-password");
  });

  it("skips hashing when the password is not modified", async () => {
    const [savePassword] = getSaveHooks();
    const doc = {
      password: "plain-password",
      isModified: jest.fn().mockReturnValue(false),
    };

    await savePassword.call(doc);

    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(doc.password).toBe("plain-password");
  });

  it("updates the timestamp before save", async () => {
    const [, updateTimestamp] = getSaveHooks();
    const doc = {
      updatedAt: new Date("2026-04-08T00:00:00.000Z"),
    };

    updateTimestamp.call(doc);

    expect(doc.updatedAt).toBeInstanceOf(Date);
    expect(doc.updatedAt.getTime()).toBeGreaterThan(
      new Date("2026-04-08T00:00:00.000Z").getTime(),
    );
  });

  it("compares passwords through bcrypt", async () => {
    const user = new User({
      nom: "Doe",
      prenom: "Jane",
      email: "jane@example.com",
      password: "hashed-password",
    });

    bcrypt.compare.mockResolvedValue(true);

    await expect(user.comparePassword("plain-password")).resolves.toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith("plain-password", "hashed-password");
  });
});
