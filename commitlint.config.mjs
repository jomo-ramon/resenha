// Conventional Commits format enforcement.
// See CODING_STANDARDS.md §10.1 for full guidance and examples.
//
// Format: <type>(<scope>): <subject>
// Examples:
//   feat(match): add team draft algorithm
//   fix(roster): prevent duplicate confirmations
//   docs: update ARCHITECTURE with multi-tenancy notes

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // New user-facing feature
        "fix", // Bug fix
        "refactor", // Internal change, no behavior change
        "docs", // Documentation only
        "test", // Adding/updating tests
        "chore", // Tooling, deps, build (not user-facing)
        "style", // Formatting, no logic change
        "perf", // Performance improvement
        "ci", // CI pipeline changes
        "build", // Build system changes
      ],
    ],
    // Allow common acronyms (CI, API, CRUD) by disallowing only fully
    // capitalized or "Sentence case" subjects — not enforcing lower-case strictly.
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "header-max-length": [2, "always", 100],
  },
};
