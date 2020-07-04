# Auto Labeling

[![CI](https://github.com/harupy/auto-labeling/workflows/CI/badge.svg)](https://github.com/harupy/auto-labeling/actions?query=workflow%3ACI)
[![Cron](https://github.com/harupy/auto-labeling/workflows/Cron/badge.svg)](https://github.com/harupy/auto-labeling/actions?query=workflow%3ACron)
[![Issues](https://github.com/harupy/auto-labeling/workflows/Issues/badge.svg)](https://github.com/harupy/auto-labeling/actions?query=workflow%3AIssues)
[![codecov](https://codecov.io/gh/harupy/auto-labeling/branch/master/graph/badge.svg)](https://codecov.io/gh/harupy/auto-labeling)
[![GitHub marketplace](https://img.shields.io/badge/marketplace-auto--labeling-brightgreen?logo=github)](https://github.com/marketplace/actions/auto-labeling)

A GitHub Action that automates labeling on issues and pull requests.

## How it works

`auto-labeling` automatically detects [task lists](https://help.github.com/en/github/managing-your-work-on-github/about-task-lists) in the description of an issue or a pull request and adds labels based on their states (checked or unchecked).

```markdown
<!-- pull_request_template.md -->

What kind of change does this PR introduce?

- [x] `bug-fix`
- [ ] `new-feature`
- [ ] `enhancement`
```

This description makes `auto-labeling` add `bug-fix`. If someone updates the description as follows:

```markdown
<!-- pull_request_template.md -->

What kind of change does this PR introduce?

- [ ] `bug-fix`
- [ ] `new-feature`
- [x] `enhancement`
```

Then, `auto-labeling` removes `bug-fix` and adds `enhancement`. **Note that unregistered labels are ignored.**

## Example workflow

```yml
name: Auto Labeling

on:
  issues:
    types:
      # Trigger the action only on relevant activity types.
      # It's actually not harmful to trigger the action on all activity types.
      - opened
      - edited

on:
  pull_request:
    types:
      - opened
      - edited

# A GitHub token created for a PR coming from a fork doesn't have
# 'admin' or 'write' permission (which is required to add labels)
# To avoid this issue, you can use the `scheduled` event and run
# this action on a certain interval.
on:
  schedule:
    - cron: '*/10 * * * *'

jobs:
  labeling:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - uses: harupy/auto-labeling@master
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          label-pattern: '- \[(.*?)\] ?`(.+?)`' # matches '- [x] `label`'
```

## Inputs

```yml
inputs:
  github-token:
    description: 'GitHub token'
    required: true

  label-pattern:
    description: >
      Pattern (regular expression) to extract label states and names (e.g. '- \[(.*?)\] ?`(.+?)`').
    required: true

  offset:
    description: >
      Only issues and pull requests updated at or after this offset (from the current time) will be labeled.
      Required only when running this action on the schedule event.
    required: false
    default: '1m' # means one month

  quiet:
    description: >
      Suppress logging output. Must be either "true" or "false"
    required: false
    default: 'false'
```
