import { GITHUB_OWNER, GITHUB_REPO, GITHUB_REPO_URL } from "~/constants/app";

interface GitHubAssetApiItem {
  browser_download_url: string;
  content_type: string;
  download_count: number;
  name: string;
  size: number;
  updated_at: string;
}

interface GitHubReleaseApiItem {
  assets: GitHubAssetApiItem[];
  body: string;
  draft: boolean;
  html_url: string;
  name: string;
  prerelease: boolean;
  published_at: string;
  tag_name: string;
}

interface GitHubRepoApiItem {
  description: string | null;
  html_url: string;
  name: string;
  open_issues_count: number;
  owner: {
    login: string;
  };
  stargazers_count: number;
  visibility: string;
}

export interface RepoSummary {
  description: string | null;
  issues: number;
  name: string;
  owner: string;
  stars: number;
  url: string;
  visibility: string;
}

export interface ReleaseAssetSummary {
  contentType: string;
  downloadCount: number;
  name: string;
  size: number;
  updatedAt: string;
  url: string;
}

export interface ReleaseSummary {
  assets: ReleaseAssetSummary[];
  body: string;
  isPrerelease: boolean;
  name: string;
  publishedAt: string;
  tagName: string;
  url: string;
}

function getGitHubHeaders() {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "User-Agent": `${GITHUB_REPO}-website`,
  });

  if (process.env.GITHUB_TOKEN) {
    headers.set("Authorization", `Bearer ${process.env.GITHUB_TOKEN}`);
  }

  return headers;
}

async function fetchGitHubJson<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: getGitHubHeaders(),
  });

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function getRepoSummary(): Promise<RepoSummary> {
  const repo = await fetchGitHubJson<GitHubRepoApiItem>(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}`);

  return {
    description: repo.description,
    issues: repo.open_issues_count,
    name: repo.name,
    owner: repo.owner.login,
    stars: repo.stargazers_count,
    url: repo.html_url || GITHUB_REPO_URL,
    visibility: repo.visibility,
  };
}

export async function getReleaseSummaries(limit = 6): Promise<ReleaseSummary[]> {
  const releases = await fetchGitHubJson<GitHubReleaseApiItem[]>(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases?per_page=${limit}`,
  );

  return releases
    .filter((release) => !release.draft)
    .map((release) => ({
      assets: release.assets.map((asset) => ({
        contentType: asset.content_type,
        downloadCount: asset.download_count,
        name: asset.name,
        size: asset.size,
        updatedAt: asset.updated_at,
        url: asset.browser_download_url,
      })),
      body: release.body ?? "",
      isPrerelease: release.prerelease,
      name: release.name,
      publishedAt: release.published_at,
      tagName: release.tag_name,
      url: release.html_url,
    }));
}
