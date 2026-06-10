import { getImage } from "astro:assets";

const GITHUB_API_BASE = "https://api.github.com";

// Topics used as control flags rather than displayed categories.
const TOPIC_PORTFOLIO = "portfolio"; // opt-in: only repos with this topic show
const TOPIC_FEATURED = "featured"; // sorts to the top
const CONTROL_TOPICS = new Set([TOPIC_PORTFOLIO, TOPIC_FEATURED]);

export interface GitHubRepo {
	name: string;
	description: string | null;
	html_url: string;
	homepage: string | null;
	topics: string[];
	fork: boolean;
	archived: boolean;
	stargazers_count: number;
	pushed_at: string;
}

export interface Project {
	title: string;
	category: string;
	description: string;
	url: string;
	image: string | null;
	featured: boolean;
}

// The repo page's og:image points to the custom uploaded social preview when
// one is set (repository-images.githubusercontent.com), and falls back to the
// auto-generated card otherwise. Scrape it rather than constructing the
// opengraph.githubassets.com URL, which only ever returns the auto-card.
async function ogImage(owner: string, repo: string): Promise<string | null> {
	try {
		const res = await fetch(`https://github.com/${owner}/${repo}`, {
			headers: { "User-Agent": "aranessa-site" },
		});
		if (!res.ok) return null;
		const html = await res.text();
		const match = html.match(
			/<meta property="og:image" content="([^"]+)"/,
		);
		return match?.[1] ?? null;
	} catch {
		return null;
	}
}

// Download & optimize the remote OG image at build time so it's served from our
// own domain. Returns null if the fetch/optimize fails (renders placeholder).
async function localImage(remoteUrl: string): Promise<string | null> {
	try {
		const optimized = await getImage({
			src: remoteUrl,
			inferSize: true,
			format: "webp",
		});
		return optimized.src;
	} catch {
		return null;
	}
}

async function toProject(repo: GitHubRepo, owner: string): Promise<Project> {
	const topics = repo.topics ?? [];
	const category =
		topics.find((t) => !CONTROL_TOPICS.has(t))?.replace(/-/g, " ") ??
		"project";

	const remote = await ogImage(owner, repo.name);

	return {
		title: repo.name,
		category,
		description: repo.description ?? "",
		url: repo.homepage || repo.html_url,
		image: remote ? await localImage(remote) : null,
		featured: topics.includes(TOPIC_FEATURED),
	};
}

/**
 * Fetches public repos tagged `portfolio` and maps them to projects, with
 * `featured`-tagged repos first, then by most recently pushed. Runs at build
 * time. Returns null on any failure so the caller can fall back to a static
 * list.
 */
export async function getProjects(): Promise<Project[] | null> {
	const owner = import.meta.env.GITHUB_USERNAME;
	const token = import.meta.env.GITHUB_TOKEN;
	if (!owner) return null;

	try {
		const res = await fetch(
			`${GITHUB_API_BASE}/users/${owner}/repos?per_page=100&sort=pushed`,
			{
				headers: {
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
					...(token ? { Authorization: `Bearer ${token}` } : {}),
				},
			},
		);
		if (!res.ok) return null;

		const repos: GitHubRepo[] = await res.json();

		// The `portfolio` topic is the sole opt-in — forks/archived included if
		// you explicitly tagged them.
		const selected = repos.filter((r) =>
			(r.topics ?? []).includes(TOPIC_PORTFOLIO),
		);
		const projects = await Promise.all(
			selected.map((r) => toProject(r, owner)),
		);
		return projects.sort(
			(a, b) => Number(b.featured) - Number(a.featured),
		);
	} catch {
		return null;
	}
}
