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
