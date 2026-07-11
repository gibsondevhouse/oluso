# Manual Acceptance Checklist

## Purpose

Provide a set of manual checks that must be performed before considering a feature or release complete.  These checks cover user experience, visual design, accessibility, and functional completeness beyond automated tests.

## Checklist

1. **Visual Consistency**
   * Pages match the design mockups or component specifications.  Fonts, colours, spacing and component alignments are correct.
   * Responsive behaviour is verified across common resolutions and window sizes.
   * Icons and illustrations render correctly and scale with DPI settings.

2. **Navigation & Routing**
   * All routes can be reached via the side panel, breadcrumbs or direct URL entry.
   * The side panel highlights the correct item when navigating between pages.
   * Breadcrumbs reflect the navigation hierarchy and provide functional links.

3. **Forms**
   * Create and edit forms load with the correct default values.
   * Validation messages appear when expected and guide the user to correct input.
   * Unsaved changes prompts appear when navigating away from a dirty form.
   * Save, Cancel and other actions (Close, Verify) behave as specified.

4. **Data Persistence**
   * Creating, editing, archiving and deleting records result in the correct changes in the lists and detail pages.
   * Archived records are hidden from default views but can be revealed via filters.

5. **Workflow Completion**
   * Corrective action closure and verification flows behave correctly: closure comments required, verification comments required, status transitions recorded.
   * Findings close automatically when all corrective actions are verified (if specified by business rules).

6. **Error Handling**
   * Simulate data errors (e.g. invalid input, disk full) and ensure that error banners appear and user actions are blocked appropriately.
   * Network or file system errors handled gracefully without application crashes.

7. **Accessibility**
   * Tab through each page and verify logical focus order.
   * Use a screen reader to ensure all content is read out in the correct order and that labels are announced.
   * Verify colour contrast manually using a colour contrast tool.

8. **Performance & Responsiveness**
   * Lists and pages load within an acceptable time (< 1 second for typical datasets).  No UI blocking during data fetches.
   * The app remains responsive during long operations (e.g. exports) and provides progress feedback.

9. **Regression Checks**
   * Navigate through other unrelated features to ensure recent changes have not introduced regressions.

10. **Deployment & Packaging**
   * Build the application for each target OS and verify that installation, launch, and database initialisation work correctly.
   * Ensure that the app uses the correct data directories and cleans up temporary files.

## Acceptance Criteria

* All checklist items have been manually verified for the current release or feature.
* Any issues discovered are documented and resolved or deferred with clear justification.
* Manual acceptance is signed off by the appropriate stakeholder (e.g. product owner or QA lead).