# Verification Prompt Template

Use this template to guide agents responsible for verifying that a feature works as intended.  Verification encompasses manual testing, accessibility checks and ensuring that acceptance criteria are met.

```
## Feature Description

Summarise the feature being verified and link to the implementation prompt and relevant specs.

## Acceptance Criteria

List the acceptance criteria defined in the implementation prompt.  The verifier must check each criterion.

## Verification Steps

Enumerate the steps needed to verify the feature.  Include test data to use, navigation steps, actions to perform and expected results.  Cover edge cases and error paths.

## Accessibility Checks

Describe any specific accessibility tests required (keyboard navigation, screen reader behaviour, colour contrast, etc.).

## Regression Checks

Identify other areas of the application that could be affected by this change and need to be tested.

## Reporting Results

The verifier should document whether each acceptance criterion was met, describe any issues found, include screenshots where relevant and assign severity.  If issues are minor and acceptable, note them; if blocking, mark the verification as failed.
```