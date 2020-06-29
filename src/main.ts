import * as core from '@actions/core';
import * as github from '@actions/github';
import * as types from '@octokit/types';

import { Label } from './types';
import { Quiet } from './enums';
import { formatStrArray, validateEnum } from '../src/utils';
import { Logger, LoggingLevel } from './logger';

/**
 * Extract labels from the description of an issue or a pull request
 * @param description string that contains labels
 * @param labelPattern regular expression to use to find labels
 * @returns labels (list of { name: string; checked: boolean; })
 *
 * @example
 * > const body = '- [ ] `a`\n- [x] `b`'
 * > const labelPattern = '- \\[([ xX]*)\\] ?`(.+?)`'
 * > extractLabels(body, labelPattern)
 * [ { name: 'a', checked: false }, { name: 'b', checked: true } ]
 */
export function extractLabels(
  description: string,
  labelPattern: string,
): Label[] {
  function helper(regex: RegExp, labels: Label[] = []): Label[] {
    const res = regex.exec(description);

    if (res) {
      const checked = res[1].trim().toLocaleLowerCase() === 'x';
      const name = res[2].trim();
      return helper(regex, [...labels, { name, checked }]);
    }
    return labels;
  }
  return helper(new RegExp(labelPattern, 'g'));
}

/**
 * Get `name` property from an object
 * @param obj object that has `name` property
 * @returns value of `name` property
 *
 * @example
 * > getName({ name: 'a' })
 * 'a'
 */
export function getName({ name }: { name: string }): string {
  return name;
}

/**
 * Get `checked` property from an object
 * @param obj object that has `checked` property
 * @returns value of `checked` property
 *
 * @example
 * > getChecked({ checked: true })
 * true
 */
export function getChecked({ checked }: { checked: boolean }): boolean {
  return checked;
}

async function processIssue(
  octokit: ReturnType<typeof github.getOctokit>,
  repo: string,
  owner: string,
  issue_number: number,
  description: string,
  labelPattern: string,
  logger: Logger,
): Promise<void> {
  logger.debug(`<<< ${issue_number} >>>`);

  // Labels already attached on the pull request
  const labelsOnIssueResp = await octokit.issues.listLabelsOnIssue({
    owner,
    repo,
    issue_number,
  });
  const labelsOnIssue = labelsOnIssueResp.data.map(getName);

  // Labels registered in the repository
  const labelsForRepoResp = await octokit.issues.listLabelsForRepo({
    owner,
    repo,
  });
  const labelsForRepo = labelsForRepoResp.data.map(getName);

  // Labels in the description
  const labels = extractLabels(description, labelPattern).filter(({ name }) =>
    // Remove labels that are not registered in the repository
    labelsForRepo.includes(name),
  );

  if (labels.length === 0) {
    logger.debug('No registered label found in the description');
    return;
  }

  logger.debug('Checked labels:');
  logger.debug(formatStrArray(labels.filter(getChecked).map(getName)));

  // Remove unchecked labels
  const shouldRemove = ({ name, checked }: Label): boolean =>
    !checked && labelsOnIssue.includes(name);
  const labelsToRemove = labels.filter(shouldRemove).map(getName);

  logger.debug('Labels to remove:');
  logger.debug(formatStrArray(labelsToRemove));

  if (labelsToRemove.length > 0) {
    labelsToRemove.forEach(async name => {
      await octokit.issues.removeLabel({
        owner,
        repo,
        issue_number,
        name,
      });
    });
  }

  // Add checked labels
  const shouldAdd = ({ name, checked }: Label): boolean =>
    checked && !labelsOnIssue.includes(name);
  const labelsToAdd = labels.filter(shouldAdd).map(getName);

  logger.debug('Labels to add:');
  logger.debug(formatStrArray(labelsToAdd));

  if (labelsToAdd.length > 0) {
    await octokit.issues.addLabels({
      owner,
      repo,
      issue_number,
      labels: labelsToAdd,
    });
  }
}

async function main(): Promise<void> {
  try {
    const token = core.getInput('repo-token', { required: true });
    const labelPattern = core.getInput('label-pattern', { required: true });
    const quiet = core.getInput('quiet', { required: true });

    validateEnum('quiet', quiet, Quiet);
    const logger = new Logger(
      quiet === Quiet.TRUE ? LoggingLevel.SILENT : LoggingLevel.DEBUG,
    );

    const octokit = github.getOctokit(token);

    const { repo, owner } = github.context.repo;

    switch (github.context.eventName) {
      case 'issues':
      case 'pull_request': {
        const issue_number = github.context.issue.number;
        const {
          data: { body },
        } = await octokit.issues.get({
          owner,
          repo,
          issue_number,
        });

        await processIssue(
          octokit,
          repo,
          owner,
          issue_number,
          body,
          labelPattern,
          logger,
        );
        break;
      }

      case 'schedule': {
        // Iterate over all open issues and pull requests
        for await (const page of octokit.paginate.iterator(
          octokit.issues.listForRepo,
          { owner, repo },
        )) {
          for (const issue of page.data) {
            const { body, number } = issue as types.IssuesGetResponseData;

            await processIssue(
              octokit,
              repo,
              owner,
              number,
              body,
              labelPattern,
              logger,
            );
          }
        }
        break;
      }

      default: {
        return;
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
