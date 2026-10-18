import { uuidv4 } from "../../src/utils/uuid";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuidv4", () => {
  const original = globalThis.crypto;
  afterEach(() => {
    Object.defineProperty(globalThis, "crypto", {
      value: original,
      configurable: true,
    });
  });

  const withCrypto = (value) =>
    Object.defineProperty(globalThis, "crypto", { value, configurable: true });

  it("genera UUID v4 validos (los que acepta la API con isUUID)", () => {
    for (let i = 0; i < 50; i += 1) expect(uuidv4()).toMatch(UUID_V4);
  });

  it("usa getRandomValues cuando no hay randomUUID", () => {
    withCrypto({ getRandomValues: (bytes) => bytes.fill(255) });
    expect(uuidv4()).toMatch(UUID_V4);
  });

  it("cae a Math.random si no hay crypto", () => {
    withCrypto(undefined);
    const a = uuidv4();
    const b = uuidv4();
    expect(a).toMatch(UUID_V4);
    expect(a).not.toBe(b);
  });
});
