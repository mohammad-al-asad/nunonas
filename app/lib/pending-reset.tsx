// @ts-nocheck
let pendingResetToken = null;

export function setPendingResetToken(token) {
  pendingResetToken = token || null;
}

export function getPendingResetToken() {
  return pendingResetToken;
}

export function clearPendingResetToken() {
  pendingResetToken = null;
}


