describe("smoke test", () => {
  it("should pass a trivial assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("should have access to TypeScript types", () => {
    const value: string = "nonet";
    expect(value).toBe("nonet");
  });
});
