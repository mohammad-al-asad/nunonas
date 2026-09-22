// @ts-nocheck
let pendingSignup = null;

export function setPendingSignup(payload) {
  pendingSignup = payload;
}

export function getPendingSignup() {
  return pendingSignup;
}

export function clearPendingSignup() {
  pendingSignup = null;
}


