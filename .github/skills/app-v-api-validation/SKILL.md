---
name: app-v-api-validation
description: "Validate coordinated changes between T-SAFV-App-V and T-SAFV-API. Use when a task touches both frontend and backend, API contracts, auth/session flows, associations, invitations, propietarios, fiscales, unidades, or traza. Reminds the agent to run Expo export for the app and a minimal backend load check before closing the task."
argument-hint: "[optional: what changed]"
user-invocable: true
---

# App-V + API Validation

## When to Use

- Use this skill when the change spans both `T-SAFV-App-V` and `T-SAFV-API`.
- Use it when frontend behavior depends on API payload shape, auth/session state, role rules, invitations, association membership, units, propietarios, fiscales, or traza.
- Use it when a UI fix also changes service calls, backend controllers, models, middleware, or routes.

## Goal

Close tasks with the cheapest realistic validation for this workspace:

1. Validate the Expo app bundle for JSX, imports, and screen wiring.
2. Validate that the API still loads with the current environment.
3. Report clearly if validation is blocked by missing environment variables or external services.

## Procedure

1. Identify whether the task changed only app files, only API files, or both.
2. If `T-SAFV-App-V` changed, run this from the app root:

```bash
npx expo export --platform android --output-dir .expo-export-check
```

3. If `T-SAFV-API` changed, run the narrowest possible backend validation first.
4. For a minimal backend boot/load check, run this from the API root:

```bash
node -e "require('./index'); console.log('api-load-ok'); process.exit(0)"
```

5. If the backend change affects startup configuration, database access, auth, or route wiring and the environment is available, prefer also running the existing smoke suite:

```bash
npm run test
```

6. If the task touched both app and API, do both validations before closing the task.
7. If either validation fails, fix the touched slice first and rerun the same validation before expanding scope.
8. If validation is blocked because required env vars such as `DATABASE_URL`, `JWT_SECRET`, or mail settings are not available in the current shell, state that explicitly instead of inventing values.

## Project-Specific Notes

- In `T-SAFV-App-V`, Expo export is the main frontend safety check because there is no lint, no typecheck, and the app uses manual screen routing in `App.js`.
- In `T-SAFV-API`, `index.js` exports the Express app and only listens when executed directly, so requiring it is a cheap load check for route and module wiring.
- The app uses a fixed `API_BASE_URL` in `src/services/api/apiClient.js`. If the app still behaves incorrectly after a clean export, verify that base URL before assuming the frontend is wrong.
- Mixed app/API changes around invitations, memberships, auth, and association rules are high risk because the UI and backend both enforce parts of the flow.

## Closeout Checklist

- Mention whether Expo export was run.
- Mention whether the backend load check was run.
- Mention whether `npm run test` was run or skipped.
- If any check was skipped, explain the blocker briefly.
