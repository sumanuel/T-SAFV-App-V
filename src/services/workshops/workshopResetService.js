/**
 * workshopResetService.js — Mock implementation
 */
import { mockDelay } from "../mock/mockDelay";
import { resetWorkshopData } from "../mock/mockStore";

export async function resetActiveWorkshopDataForCurrentUser() {
  await mockDelay(500);
  resetWorkshopData();
}
