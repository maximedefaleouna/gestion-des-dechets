// Test utility functions directly for 100% coverage

const { ROLES } = require("../../src/common/utils/autorize");
const {
  getReferenceId,
  getAuditFields,
  getUpdateAuditFields,
} = require("../../src/modules/collectes/collecte.service");

describe("collecte.service utility functions", () => {
  describe("getReferenceId", () => {
    it("returns null for undefined value - line 14", () => {
      expect(getReferenceId(undefined)).toBeNull();
    });

    it("returns null for null value - line 14", () => {
      expect(getReferenceId(null)).toBeNull();
    });

    it("returns string value as-is - line 18", () => {
      expect(getReferenceId("string-id-123")).toBe("string-id-123");
    });

    it("extracts _id from object - line 21", () => {
      const obj = { _id: "object-id-456" };
      expect(getReferenceId(obj)).toBe("object-id-456");
    });

    it("extracts id from object if _id missing - line 21", () => {
      const obj = { id: "object-id-789" };
      expect(getReferenceId(obj)).toBe("object-id-789");
    });
  });

  describe("getAuditFields", () => {
    it("returns empty object when currentUser is null - line 69", () => {
      expect(getAuditFields(null)).toEqual({});
    });

    it("returns empty object when currentUser is undefined - line 69", () => {
      expect(getAuditFields(undefined)).toEqual({});
    });

    it("returns audit fields when currentUser is provided - line 66-67", () => {
      const currentUser = { id: "user-123" };
      expect(getAuditFields(currentUser)).toEqual({
        createdBy: "user-123",
        updatedBy: "user-123",
      });
    });
  });

  describe("getUpdateAuditFields", () => {
    it("returns empty object when currentUser is null - line 77", () => {
      expect(getUpdateAuditFields(null)).toEqual({});
    });

    it("returns empty object when currentUser is undefined - line 77", () => {
      expect(getUpdateAuditFields(undefined)).toEqual({});
    });

    it("returns update fields when currentUser is provided - line 74-75", () => {
      const currentUser = { id: "user-456" };
      const result = getUpdateAuditFields(currentUser);
      
      expect(result).toHaveProperty("updatedBy", "user-456");
      expect(result).toHaveProperty("updatedAt");
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });
});
