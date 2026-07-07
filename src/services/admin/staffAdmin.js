/**
 * staffAdmin.js — Mock implementation
 */
import { mockDelay } from "../mock/mockDelay";
import {
  getStaffProfiles,
  addStaffProfile,
  updateStaffProfile as storeUpdateStaffProfile,
} from "../mock/mockStore";
import { USER_ROLES, USER_STATUSES } from "../../constants/accessControl";

export async function listStaffProfiles(workshopId) {
  await mockDelay(250);
  return getStaffProfiles();
}

export async function listPendingApprovals() {
  await mockDelay(200);
  return [];
}

export async function listPendingInvitations() {
  await mockDelay(200);
  return [];
}

export async function createStaffInvitation({ email, role, invitedByUid }) {
  await mockDelay(300);
  // Mock: just returns a fake invitation object
  return {
    id: `inv-${Date.now()}`,
    email,
    role,
    status: "pending",
    invitedByUid,
    createdAt: new Date(),
  };
}

export async function cancelStaffInvitation(invitationId) {
  await mockDelay(200);
}

export async function approveUserProfile(uid, { role } = {}) {
  await mockDelay(300);
  storeUpdateStaffProfile(uid, {
    status: USER_STATUSES.ACTIVE,
    role: role || USER_ROLES.RECEPTION,
  });
}

export async function updateStaffProfile(uid, data) {
  await mockDelay(300);
  storeUpdateStaffProfile(uid, data);
}
