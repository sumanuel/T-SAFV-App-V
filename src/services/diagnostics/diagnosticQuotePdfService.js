/**
 * diagnosticQuotePdfService.js — Mock implementation
 * Returns a stub file URI. Replace with real PDF logic when needed.
 */
import { mockDelay } from "../mock/mockDelay";

export async function ensureDiagnosticQuotePdfFile(
  diagnostic,
  vehicle,
  client,
) {
  await mockDelay(400);
  // Stub: in a real implementation this would generate and return a local PDF file URI
  // For now we return null to signal no file is available
  return null;
}
