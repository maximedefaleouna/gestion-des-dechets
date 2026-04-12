const mockDechetModel = jest.fn();
mockDechetModel.find = jest.fn();
mockDechetModel.findById = jest.fn();
mockDechetModel.findByIdAndUpdate = jest.fn();

jest.mock("../../src/modules/dechets/dechet.model", () => mockDechetModel);

const dechetService = require("../../src/modules/dechets/dechet.service");

const createDechetDoc = (overrides = {}) => ({
  _id: "dechet-1",
  nom: "Papier",
  categorie: "Recyclable",
  description: "Papier usager",
  uniteMesure: "kg",
  dangereux: false,
  isDeleted: false,
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

describe("dechet.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDechetModel.mockImplementation((data) => {
      const doc = createDechetDoc(data);
      doc.save = jest.fn().mockResolvedValue(doc);
      return doc;
    });
  });

  it("creates a dechet", async () => {
    const result = await dechetService.createDechet({
      nom: "Bouteille plastique",
      categorie: "Recyclable",
      description: "Bouteille PET",
    });

    expect(result.nom).toBe("Bouteille plastique");
    expect(mockDechetModel).toHaveBeenCalledWith({
      nom: "Bouteille plastique",
      categorie: "Recyclable",
      description: "Bouteille PET",
    });
  });

  it("returns all dechets", async () => {
    const dechets = [createDechetDoc({ _id: "dechet-2", nom: "Verre" })];
    mockDechetModel.find.mockResolvedValue(dechets);

    const result = await dechetService.getAllDechets();

    expect(result).toEqual(dechets);
  });

  it("returns a dechet by id", async () => {
    const dechet = createDechetDoc({ _id: "dechet-2" });
    mockDechetModel.findById.mockResolvedValue(dechet);

    await expect(dechetService.getDechetById("dechet-2")).resolves.toBe(dechet);
  });

  it("rejects deleted dechets", async () => {
    mockDechetModel.findById.mockResolvedValue(
      createDechetDoc({ _id: "dechet-2", isDeleted: true }),
    );

    await expect(dechetService.getDechetById("dechet-2")).rejects.toMatchObject({
      message: expect.stringContaining("Dechet non"),
      statusCode: 404,
    });
  });

  it("updates a dechet", async () => {
    const updated = createDechetDoc({ _id: "dechet-2", nom: "Metal" });
    mockDechetModel.findByIdAndUpdate.mockResolvedValue(updated);

    await expect(
      dechetService.updateDechet("dechet-2", { nom: "Metal" }),
    ).resolves.toBe(updated);
  });

  it("rejects unknown updates", async () => {
    mockDechetModel.findByIdAndUpdate.mockResolvedValue(null);

    await expect(
      dechetService.updateDechet("dechet-2", { nom: "Metal" }),
    ).rejects.toMatchObject({
      message: expect.stringContaining("Dechet non"),
      statusCode: 404,
    });
  });

  it("soft-deletes a dechet", async () => {
    const deleted = createDechetDoc({ _id: "dechet-2" });
    mockDechetModel.findByIdAndUpdate.mockResolvedValue(deleted);

    const result = await dechetService.deleteDechet("dechet-2");

    expect(result).toBe(deleted);
    expect(mockDechetModel.findByIdAndUpdate).toHaveBeenCalledWith(
      "dechet-2",
      { isDeleted: true },
      { new: true },
    );
  });

  it("rejects unknown deletions", async () => {
    mockDechetModel.findByIdAndUpdate.mockResolvedValue(null);

    await expect(dechetService.deleteDechet("dechet-2")).rejects.toMatchObject({
      message: expect.stringContaining("Dechet non"),
      statusCode: 404,
    });
  });
});
