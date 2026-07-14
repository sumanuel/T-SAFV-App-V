---
description: "Use when designing or editing T-SAFV-App-V mobile screens in src/screens/**/*.js. Covers the visual line, operational language, and interaction rules for association, fiscalization, traceability, invitations, propietarios, fiscales, and units in this Expo React Native project."
name: "T-SAFV-App-V Screens UI"
applyTo: "src/screens/**/*.js"
---

# T-SAFV-App-V Screen Guidelines

- Design for operational clarity around association management and fiscalization. Each screen should help the user understand what association they are in, what entities they manage, and what next action is available.
- Use the active domain vocabulary consistently: asociación, fiscalización, traza, invitación, propietario, fiscal, unidad, punto de control. Avoid reintroducing taller, cliente, diagnóstico, orden, stock, mantenimiento, reparación, or workshop copy in active screens unless the screen is explicitly legacy.
- Prefer the current visual system instead of inventing a new one. Reuse the color roles from `src/context/ThemeContext.js`, the spacing and type helpers from `src/utils/responsive.js`, and the shared header patterns from `src/components/common/WorkshopScreenHeader.js`.
- Keep one primary action per screen clearly dominant. Secondary actions should be visually calmer and should not compete with save, create, accept, or fiscalizar flows.
- Organize content in layered sections: hero/header, summary card, filters or status, primary list or form, and final secondary actions. Avoid long flat ScrollViews with mixed priority blocks.
- Lists must be scan-friendly on mobile. Each card should expose identity first, then state, then the next useful action. Do not overload list items with extra metadata that belongs in detail or form screens.
- Association identity should feel official and stable. When showing association data, prioritize nombre, RIF, contact data, role, and logo if available before decorative content.
- Fiscalization and traceability screens should read like operational control surfaces, not admin forms. Surface unit, fiscal, point of control, date range, and status first.
- Invitation flows should make role, current state, and consequence explicit. Use calm but clear status language for pendiente, aceptada, cancelada, or blocked scenarios.
- Empty states must explain the missing business condition and the direct next action. For example: no association, no units, no propietarios, no fiscales, no invitations, or no traza in the selected range.
- Forms should be grouped by intent. Association identity, contact info, invitation info, unit data, and fiscalization data should appear as separate logical blocks rather than a single uninterrupted field stack.
- Destructive actions such as dar de baja, eliminar unidad, cancelar invitación, or reset flows must be visually separated from save and primary actions. They should never look like the safest default tap.
- Copy should stay short, direct, and institutional in Spanish. Prefer operational wording over promotional wording. The app should sound like a control and registration tool, not a marketing product.
- Preserve the active manual navigation model from `App.js`. When adding or reshaping screen actions, keep back flows, return context, and screen handoff expectations compatible with the current `activeScreen` pattern.
- If you touch a legacy screen that still lives under `src/screens/`, do not drag its old vocabulary or layout assumptions back into active screens. Align it to the active association/fiscalization language only if that screen is still reachable from `App.js`.
