import test from "node:test";
import assert from "node:assert/strict";
import { saveInputs, restoreInputs, clearInputs } from "../dist/form-persistence.mjs";

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("saves and restores edited values, including empty fields and checkboxes", () => {
  const saved = storage();
  const before = [
    { id: "quantity-0", type: "number", value: "42" },
    { id: "retail-0", type: "number", value: "" },
    { id: "premiumQuality", type: "checkbox", checked: true },
  ];
  saveInputs(saved, "trees", before);
  const after = [
    { id: "quantity-0", type: "number", value: "0" },
    { id: "retail-0", type: "number", value: "100" },
    { id: "premiumQuality", type: "checkbox", checked: false },
  ];
  restoreInputs(saved, "trees", after);
  assert.equal(after[0].value, "42");
  assert.equal(after[1].value, "");
  assert.equal(after[2].checked, true);
});

test("keeps calculator pages separate and reset clears saved values", () => {
  const saved = storage();
  saveInputs(saved, "trees", [{ id: "quantity-0", type: "number", value: "31" }]);
  saveInputs(saved, "photos", [{ id: "classic-bookings", type: "number", value: "2" }]);
  const photo = { id: "classic-bookings", type: "number", value: "0" };
  restoreInputs(saved, "photos", [photo]);
  assert.equal(photo.value, "2");
  clearInputs(saved, "photos");
  photo.value = "0";
  restoreInputs(saved, "photos", [photo]);
  assert.equal(photo.value, "0");
  const tree = { id: "quantity-0", type: "number", value: "0" };
  restoreInputs(saved, "trees", [tree]);
  assert.equal(tree.value, "31");
});

test("ignores corrupt or inaccessible storage without breaking the calculator", () => {
  const saved = storage();
  saved.setItem("trees", "not JSON");
  const input = { id: "quantity-0", type: "number", value: "7" };
  restoreInputs(saved, "trees", [input]);
  assert.equal(input.value, "7");
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  assert.doesNotThrow(() => saveInputs(blocked, "trees", [input]));
  assert.doesNotThrow(() => restoreInputs(blocked, "trees", [input]));
  assert.doesNotThrow(() => clearInputs(blocked, "trees"));
});
