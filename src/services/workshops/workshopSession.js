/**
 * workshopSession.js
 * Simplified session singleton — always returns the single mock workshop.
 */
const MOCK_WORKSHOP_ID = "workshop-1";

export function getActiveWorkshopId() {
  return MOCK_WORKSHOP_ID;
}

export function requireActiveWorkshopId() {
  return MOCK_WORKSHOP_ID;
}

export function getActiveWorkshopSession() {
  return {
    workshopId: MOCK_WORKSHOP_ID,
    workshopName: "Asociación Demo T-SAFV",
    role: "administrator",
  };
}

export function setActiveWorkshopSession() {}
export function clearActiveWorkshopSession() {}
