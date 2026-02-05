export const LASTFM_API_BASE = "https://ws.audioscrobbler.com/2.0/";

export interface Track {
	name: string;
	artist: {
		"#text": string;
	};
	album: {
		"#text": string;
	};
	image: Array<{
		"#text": string;
		size: string;
	}>;
	url: string;
	date?: {
		uts: string;
		"#text": string;
	};
	"@attr"?: {
		nowplaying: string;
	};
}

export interface RecentTracksResponse {
	recenttracks: {
		track: Track[];
		"@attr": {
			user: string;
			page: string;
			perPage: string;
			totalPages: string;
			total: string;
		};
	};
}

export interface TopArtist {
	name: string;
	playcount: string;
	url: string;
	image: Array<{
		"#text": string;
		size: string;
	}>;
}

export interface TopAlbum {
	name: string;
	playcount: string;
	url: string;
	artist: {
		name: string;
		url: string;
	};
	image: Array<{
		"#text": string;
		size: string;
	}>;
}

export interface TopTrack {
	name: string;
	playcount: string;
	url: string;
	artist: {
		name: string;
		url: string;
	};
	image: Array<{
		"#text": string;
		size: string;
	}>;
}

export async function getTopArtists(
	limit: number = 5,
	period: string = "3month",
): Promise<TopArtist[]> {
	const apiKey = import.meta.env.PUBLIC_LASTFM_API_KEY;
	const username = import.meta.env.PUBLIC_LASTFM_USERNAME;

	if (!apiKey || !username) return [];

	try {
		const params = new URLSearchParams({
			method: "user.gettopartists",
			user: username,
			api_key: apiKey,
			format: "json",
			limit: limit.toString(),
			period: period,
		});

		const response = await fetch(`${LASTFM_API_BASE}?${params.toString()}`);
		const data = await response.json();
		return data.topartists.artist;
	} catch (error) {
		console.error("Failed to fetch top artists:", error);
		return [];
	}
}

export async function getTopAlbums(
	limit: number = 5,
	period: string = "3month",
): Promise<TopAlbum[]> {
	const apiKey = import.meta.env.PUBLIC_LASTFM_API_KEY;
	const username = import.meta.env.PUBLIC_LASTFM_USERNAME;

	if (!apiKey || !username) return [];

	try {
		const params = new URLSearchParams({
			method: "user.gettopalbums",
			user: username,
			api_key: apiKey,
			format: "json",
			limit: limit.toString(),
			period: period,
		});

		const response = await fetch(`${LASTFM_API_BASE}?${params.toString()}`);
		const data = await response.json();
		return data.topalbums.album;
	} catch (error) {
		console.error("Failed to fetch top albums:", error);
		return [];
	}
}

export async function getTopTracks(
	limit: number = 5,
	period: string = "3month",
): Promise<TopTrack[]> {
	const apiKey = import.meta.env.PUBLIC_LASTFM_API_KEY;
	const username = import.meta.env.PUBLIC_LASTFM_USERNAME;

	if (!apiKey || !username) return [];

	try {
		const params = new URLSearchParams({
			method: "user.gettoptracks",
			user: username,
			api_key: apiKey,
			format: "json",
			limit: limit.toString(),
			period: period,
		});

		const response = await fetch(`${LASTFM_API_BASE}?${params.toString()}`);
		const data = await response.json();
		return data.toptracks.track;
	} catch (error) {
		console.error("Failed to fetch top tracks:", error);
		return [];
	}
}

export async function getRecentTracks(limit: number = 10): Promise<Track[]> {
	const apiKey = import.meta.env.PUBLIC_LASTFM_API_KEY;
	const username = import.meta.env.PUBLIC_LASTFM_USERNAME;

	if (!apiKey || !username) {
		console.error("Last.fm API key or username not configured");
		return [];
	}

	try {
		const params = new URLSearchParams({
			method: "user.getrecenttracks",
			user: username,
			api_key: apiKey,
			format: "json",
			limit: limit.toString(),
		});

		const response = await fetch(`${LASTFM_API_BASE}?${params.toString()}`);

		if (!response.ok) {
			throw new Error(`Last.fm API error: ${response.statusText}`);
		}

		const data: RecentTracksResponse = await response.json();
		return data.recenttracks.track;
	} catch (error) {
		console.error("Failed to fetch recent tracks:", error);
		return [];
	}
}
