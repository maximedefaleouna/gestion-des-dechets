// Test dechet.service utility functions for 100% coverage

const {
  getAuditFields,
  getUpdateAuditFields,
  getDeleteAuditFields,
} = require("../../src/modules/dechets/dechet.service");

describe("dechet.service utility functions", () => {
  describe("getAuditFields - lines 9-15", () => {
    it("returns empty object when currentUser is null - line 15", () => {
      expect(getAuditFields(null)).toEqual({});
    });

    it("returns empty object when currentUser is undefined - line 15", () => {
      expect(getAuditFields(undefined)).toEqual({});
    });

    it("returns audit fields when currentUser is provided - lines 12-13", () => {
      const currentUser = { id: "user-123" };
      expect(getAuditFields(currentUser)).toEqual({
        createdBy: "user-123",
        updatedBy: "user-123",
      });
    });
  });

  describe("getUpdateAuditFields - lines 17-23", () => {
    it("returns empty object when currentUser is null - line 23", () => {
      expect(getUpdateAuditFields(null)).toEqual({});
    });

    it("returns empty object when currentUser is undefined - line 23", () => {
      expect(getUpdateAuditFields(undefined)).toEqual({});
    });

    it("returns update fields when currentUser is provided - lines 20-21", () => {
      const currentUser = { id: "user-456" };
      const result = getUpdateAuditFields(currentUser);
      
      expect(result).toHaveProperty("updatedBy", "user-456");
      expect(result).toHaveProperty("updatedAt");
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe("getDeleteAuditFields - lines 25-30", () => {
    it("handles null currentUser - line 28", () => {
      const result = getDeleteAuditFields(null);
      
      expect(result.isDeleted).toBe(true);
      expect(result.deletedAt).toBeInstanceOf(Date);
      expect(result.deletedBy).toBeNull();
    });

    it("handles undefined currentUser - line 28", () => {
      const result = getDeleteAuditFields(undefined);
      
      expect(result.isDeleted).toBe(true);
      expect(result.deletedBy).toBeNull();
    });

    it("includes currentUser id when provided - line 28", () => {
      const currentUser = { id: "user-789" };
      const result = getDeleteAuditFields(currentUser);
      
      expect(result.deletedBy).toBe("user-789");
      expect(result.updatedBy).toBe("user-789");
    });
  });
});
