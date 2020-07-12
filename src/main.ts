import * as core from '@actions/core';
import * as github from '@actions/github';
import * as types from '@octokit/types';

import { Label } from './types';
import { Quiet } from './enums';
import {
  formatStrArray,
  validateEnum,
  parseOffsetString,
  getOffsetDate,
} from './utils';
import { extractLabels, getName, getChecked } from './labels';
import { Logger, LoggingLevel } from './logger';

async function processIssue(
  octokit: ReturnType<typeof github.getOctokit>,
  repo: string,
  owner: string,
  issue_number: number,
  htmlUrl: string,
  description: string,
  labelPattern: string,
  logger: Logger,
): Promise<void> {
  logger.debug(`--- ${htmlUrl} ---`);

  // Labels extracted from the description
  const labels = extractLabels(description, labelPattern);
  if (labels.length === 0) {
    logger.debug('No labels found');
    return;
  }

  // Labels registered in the repository
  const labelsForRepoResp = await octokit.paginate(
    octokit.issues.listLabelsForRepo,
    {
      owner: 'mlflow',
      repo: 'mlflow',
    },
  );
  logger.debug(labelsForRepoResp);

  throw Error();
  const labelsForRepo = labelsForRepoResp.map(getName);
  const labelsRegistered = labels.filter(({ name }) =>
    labelsForRepo.includes(name),
  );

  if (labelsRegistered.length === 0) {
    logger.debug('No registered labels found');
    return;
  }

  // Labels that are already applied on the issue
  const labelsOnIssueResp = await octokit.issues.listLabelsOnIssue({
    owner,
    repo,
    issue_number,
  });
  const labelsOnIssue = labelsOnIssueResp.data.map(getName);

  logger.debug('Checked labels:');
  logger.debug(
    formatStrArray(labelsRegistered.filter(getChecked).map(getName)),
  );

  // Remove unchecked labels
  const shouldRemove = ({ name, checked }: Label): boolean =>
    !checked && labelsOnIssue.includes(name);
  const labelsToRemove = labelsRegistered.filter(shouldRemove).map(getName);

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
  const labelsToAdd = labelsRegistered.filter(shouldAdd).map(getName);

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
    const token = core.getInput('github-token', { required: true });
    const labelPattern = core.getInput('label-pattern', { required: true });
    const quiet = core.getInput('quiet', { required: false });
    const offset = core.getInput('offset', { required: false });

    validateEnum('quiet', quiet, Quiet);
    const logger = new Logger(
      quiet === Quiet.TRUE ? LoggingLevel.SILENT : LoggingLevel.DEBUG,
    );

    const octokit = github.getOctokit(token);

    const { repo, owner } = github.context.repo;
    const { eventName } = github.context;

    switch (eventName) {
      case 'issues':
      case 'pull_request': {
        const issue_number = github.context.issue.number;
        const issueResp = await octokit.issues.get({
          owner,
          repo,
          issue_number,
        });
        const { body, html_url } = issueResp.data;

        await processIssue(
          octokit,
          repo,
          owner,
          issue_number,
          html_url,
          body,
          labelPattern,
          logger,
        );
        break;
      }

      case 'schedule': {
        const parsed = parseOffsetString(offset);
        const offsetDate = getOffsetDate(new Date(), ...parsed);

        // Iterate over all open issues and pull requests
        for await (const page of octokit.paginate.iterator(
          octokit.issues.listForRepo,
          { owner, repo, since: offsetDate.toISOString() },
        )) {
          for (const issue of page.data) {
            const {
              body,
              number,
              html_url,
            } = issue as types.IssuesGetResponseData;

            await processIssue(
              octokit,
              repo,
              owner,
              number,
              html_url,
              body,
              labelPattern,
              logger,
            );
          }

          const rateLimitResp = await octokit.rateLimit.get();
          logger.debug(rateLimitResp.data);
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
