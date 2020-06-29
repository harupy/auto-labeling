import * as core from '@actions/core';
import * as github from '@actions/github';
import * as types from '@octokit/types';

import { Label } from './types';
import { Quiet } from './enums';
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
  return helper(new RegExp(labelPattern, 'gm'));
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

/**
 * Format a string array into a list
 * @param strArray string array
 * @returns string that represents a list
 *
 * @example
 * > toListStr(['a', 'b'])
 * - a
 * - b
 */
export function formatStrArray(strArray: string[]): string {
  if (strArray.length === 0) {
    return '';
  }
  return strArray.map(s => `- ${s}`).join('\n') + '\n';
}

/**
 * Validate an enum value
 * @param name name of the variable to check
 * @param val value to check
 * @param enumObj enum object
 *
 * @example
 * > enum CD {
 *   C = 'c',
 *   D = 'd',
 * }
 * > validateEnums('a', 'b', CD)
 * Uncaught Error: `a` must be one of ['c', 'd'], but got 'b'
 */
export function validateEnum<T>(
  name: T,
  val: T,
  enumObj: { [key: string]: T },
): never | void {
  const values = Object.values(enumObj);
  if (!values.includes(val)) {
    const wrap = (s: T): string => `'${s}'`;
    const joined = values.map(wrap).join(', ');
    throw new Error(
      `\`${name}\` must be one of [${joined}], but got ${wrap(val)}`,
    );
  }
}

async function processLabels(
  octokit: ReturnType<typeof github.getOctokit>,
  repo: string,
  owner: string,
  issue_number: number,
  description: string,
  labelPattern: string,
  quiet: boolean,
): Promise<void> {
  const logger = new Logger(quiet ? LoggingLevel.SILENT : LoggingLevel.DEBUG);

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
    logger.debug('No label found in the description');
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

    const octokit = github.getOctokit(token);

    const { repo, owner } = github.context.repo;

    console.log(github.context.eventName);

    switch (github.context.eventName) {
      case 'pull_request':
        const pull_number = github.context.issue.number;
        const {
          data: { body },
        } = await octokit.pulls.get({
          owner,
          repo,
          pull_number,
        });

        await processLabels(
          octokit,
          repo,
          owner,
          pull_number,
          body,
          labelPattern,
          quiet === 'true',
        );

      case 'scheduled':
        // Iterate over all open issues and pull requests
        for await (const page of octokit.paginate.iterator(
          octokit.issues.listForRepo,
          { owner, repo },
        )) {
          for (const issue of page.data) {
            const {
              body,
              number: issue_number,
            } = issue as types.IssuesGetResponseData;

            await processLabels(
              octokit,
              repo,
              owner,
              issue_number,
              body,
              labelPattern,
              quiet === 'true',
            );
          }
        }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
