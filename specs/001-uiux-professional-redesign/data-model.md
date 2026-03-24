# Data Model — Comprehensive Professional UI/UX Refresh

## Entity: DesignTokenSet
- Fields:
  - id (string, semantic token group name)
  - colorTokens (map: background, foreground, muted, primary, destructive, border)
  - radiusTokens (map: sm, md, lg)
  - typographyTokens (map: heading/body/label sizing)
  - spacingScale (ordered token list)
  - stateTokens (map: success, warning, error, info)
- Validation rules:
  - every semantic token used by components must be defined in this set
  - no component may depend on ad-hoc hard-coded visual constants
- Relationships:
  - one-to-many with ComponentPattern
  - one-to-many with PageExperience

## Entity: ComponentPattern
- Fields:
  - id (string)
  - type (button|input|card|badge|table|dialog|sheet|tabs|toast|empty-state|skeleton)
  - variants (list: primary/secondary/destructive/ghost etc.)
  - interactionRules (focus, hover, disabled, loading, pressed)
  - accessibilityRules (keyboard, aria semantics, contrast requirements)
  - usageGuidelines (short markdown guidance)
- Validation rules:
  - each interactive component must define focus-visible and disabled behavior
  - each form control must define label/help/error rendering behavior
- Relationships:
  - many-to-one with DesignTokenSet
  - one-to-many with FlowStep

## Entity: PageExperience
- Fields:
  - id (string)
  - pageName (event-list|event-details|auth|checkout|organizer-dashboard|admin-organizer-requests)
  - userRole (attendee|organizer|admin)
  - layoutRegions (header, content, sidebar/panel, action-area)
  - primaryAction (string)
  - secondaryActions (list)
  - responsiveRules (per breakpoint behavior)
- Validation rules:
  - every page must expose one clearly identifiable primary action
  - every page must define loading, empty, success, and error state behavior
- Relationships:
  - one-to-many with InteractionState
  - one-to-many with FlowStep

## Entity: InteractionState
- Fields:
  - id (string)
  - stateType (loading|empty|validation-error|api-error|success|disabled)
  - messagePattern (title/body/action text)
  - recoveryAction (retry|edit-input|navigate|dismiss)
  - severity (info|warning|error|success)
- Validation rules:
  - every recoverable failure state must include a user-visible recovery action
  - validation errors must be field-specific where possible
- Relationships:
  - many-to-one with PageExperience
  - many-to-one with FlowStep

## Entity: FlowStep
- Fields:
  - id (string)
  - flowName (attendee-browse-book|auth-checkout|organizer-manage|admin-review)
  - sequenceOrder (integer)
  - screenRef (PageExperience id)
  - requiredInputs (list)
  - expectedOutputs (list)
  - blockers (list of known failure cases)
- Validation rules:
  - each critical flow must have no missing handoff between steps
  - each step must identify which InteractionState appears on failure
- Relationships:
  - many-to-one with PageExperience
  - many-to-one with ComponentPattern
  - one-to-many with InteractionState

## State Transitions
- InteractionState:
  - loading -> success
  - loading -> empty
  - loading -> api-error
  - validation-error -> loading (after user correction + retry)
  - api-error -> loading (on retry) | dismissed (when user exits flow)
- FlowStep:
  - idle -> in-progress -> completed
  - in-progress -> blocked (validation-error|api-error)
  - blocked -> in-progress (after recovery action)

## Notes
- This feature introduces UI/UX domain entities for design consistency; backend persistence entities remain unchanged.
- Existing REST contracts are consumed as-is; data-model changes are presentation-layer and interaction-layer focused.
