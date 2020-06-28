# Auto Labeling

A GitHub Action that automates labeling on issues and pull requests.

## How it works

`auto-labeling` automatically detects [task lists](https://help.github.com/en/github/managing-your-work-on-github/about-task-lists) in the description of an issue or a pull request and adds labels based on their states (checked or unchecked).

```markdown
<!-- pull_request_template.md -->

Select categories that this PR affects.

- [ ] `category 1`: ...
- [ ] `category 2`: ...
- [x] `category 3`: ...
```

With this example, `auto-labeling` adds `category 3`. When a user updates the description later as follows:

```markdown
<!-- pull_request_template.md -->

Select a category that this issue belongs to.

- [ ] `category 1`: ...
- [x] `category 2`: ...
- [ ] `category 3`: ...
```

`auto-labeling` automatically removes `category 3` and adds `category`.

## Example workflow

```yml
name: Auto Labeling

# A GitHub token created on a forked PR does not have a write permission required to add labels.
# To avoid this issue, use the `scheduled` event and run this action on a certain interval.
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
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          label-pattern: '- \\[(.*?)\\] ?`(.+?)`' # matches '- [x] `label`'
```
