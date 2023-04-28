export type Label = {
  name: string;
  checked: boolean;
};

export type IssueEvent = {
  // Copied from `IssuesListEventsResponseData`
  id?: number | null | undefined;
  node_id?: string | null | undefined;
  url?: string | null | undefined;
  actor?: {
    name?: string | null | undefined;
    email?: string | null | undefined;
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string | null;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
    starred_at?: string | undefined;
  } | undefined;
  event?: string | undefined;
  commit_id?: string | null | undefined;
  commit_url?: string | null | undefined;
  created_at?: string | undefined;
  // Add a new field
  label?: {
    name: string;
    color: string;
  };
};
