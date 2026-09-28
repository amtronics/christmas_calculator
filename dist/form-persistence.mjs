export function saveInputs(storage, key, inputs) {
  try {
    const values = Object.create(null);
    for (const input of inputs) {
      if (input.id) values[input.id] = input.type === "checkbox" ? input.checked : input.value;
    }
    storage.setItem(key, JSON.stringify(values));
  } catch {
    // The calculator remains usable when browser storage is unavailable.
  }
}

export function restoreInputs(storage, key, inputs) {
  try {
    const values = JSON.parse(storage.getItem(key));
    if (!values || typeof values !== "object" || Array.isArray(values)) return;
    for (const input of inputs) {
      if (!input.id || !Object.hasOwn(values, input.id)) continue;
      const value = values[input.id];
      if (input.type === "checkbox" && typeof value === "boolean") input.checked = value;
      else if (input.type !== "checkbox" && typeof value === "string") input.value = value;
    }
  } catch {
    // Corrupt or blocked storage falls back to the current defaults.
  }
}

export function clearInputs(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // Reset still updates the visible form when storage is unavailable.
  }
}
