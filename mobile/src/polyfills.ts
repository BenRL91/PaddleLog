import clone from "@ungap/structured-clone";
if (typeof globalThis.structuredClone !== "function")
  globalThis.structuredClone = clone;
