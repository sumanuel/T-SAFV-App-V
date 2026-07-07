/**
 * workshopService.js — Mock implementation
 */
import { mockDelay } from "../mock/mockDelay";
import {
  getWorkshop,
  updateWorkshop as storeUpdateWorkshop,
} from "../mock/mockStore";

export async function getActiveWorkshop() {
  await mockDelay(200);
  return getWorkshop();
}

export async function updateWorkshop(workshopId, data) {
  await mockDelay(300);
  return storeUpdateWorkshop(data);
}

export async function renameWorkshop(workshopId, name) {
  await mockDelay(300);
  return storeUpdateWorkshop({ name });
}

export async function resolveUserWorkshopContext({ uid }) {
  const workshop = getWorkshop();
  return {
    requiresWorkshopSetup: false,
    memberships: [
      {
        workshopId: workshop.id,
        workshopName: workshop.name,
        role: "administrator",
        status: "active",
        uid,
      },
    ],
    activeMembership: {
      workshopId: workshop.id,
      workshopName: workshop.name,
      role: "administrator",
      status: "active",
      uid,
    },
    activeWorkshop: workshop,
  };
}

export async function ensurePersonalWorkshopForUser() {
  return getWorkshop();
}

export async function listWorkshopMemberships() {
  return [];
}

export async function getWorkshopMembership() {
  return null;
}

export async function upsertWorkshopMembership() {
  return null;
}
