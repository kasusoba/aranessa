import { useEffect, useState } from "preact/hooks";
import { getRecentTracks, type Track } from "../lib/lastfm";

export default function RecentListensHome() {
	const [tracks, setTracks] = useState<Track[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getRecentTracks(7).then((data) => {
			setTracks(data);
			setLoading(false);
		});
	}, []);

	if (loading) {
		return (
			<section class="space-y-4 animate-pulse">
				<div class="h-6 w-48 bg-darkblue-200/50 rounded"></div>
				<div class="flex flex-col md:flex-row gap-6 items-start">
					<div class="w-24 h-24 bg-darkblue-200/50 rounded-xl shrink-0"></div>
					<div class="flex flex-col w-full gap-3">
						<div class="h-4 w-32 bg-darkblue-200/50 rounded"></div>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
							{[...Array(6)].map((_, i) => (
								<div
									key={i}
									class="h-3 w-full bg-darkblue-200/50 rounded"
								></div>
							))}
						</div>
					</div>
				</div>
			</section>
		);
	}

	if (tracks.length === 0) {
		// Fallback or empty state if API fails or no tracks
		return null;
	}

	const currentTrack = tracks[0];
	const isPlaying = currentTrack["@attr"]?.nowplaying === "true";
	const recentTracks = tracks.slice(1);
	const albumArt =
		currentTrack.image.find((img) => img.size === "large")?.["#text"] ||
		currentTrack.image[0]?.["#text"];

	return (
		<section class="space-y-4">
			<h2 class="font-medium tracking-wide">
				{isPlaying ? "currently listening to" : "recently listened to"}
			</h2>
			<div class="flex flex-col md:flex-row gap-6 items-start">
				{/* Album Art */}
				<a href={currentTrack.url} target="_blank" rel="noopener noreferrer">
					<div class="w-24 h-24 bg-darkblue-200/50 rounded-xl flex items-center justify-center shrink-0 border border-white/5 overflow-hidden relative">
						{albumArt ? (
							<img
								src={albumArt}
								alt={currentTrack.album["#text"]}
								class="w-full h-full object-cover"
							/>
						) : (
							<div class="w-8 h-8 rounded-full border-2 border-primary-opaque/20 flex items-center justify-center">
								<div class="w-2 h-2 rounded-full bg-primary-opaque/40"></div>
							</div>
						)}
					</div>
				</a>

				{/* Content */}
				<div class="flex flex-col w-full gap-3">
					<div class="flex items-center gap-2 text-sm">
						<a
							href={currentTrack.url}
							target="_blank"
							rel="noopener noreferrer"
							class="text-accent-blue font-medium truncate max-w-[150px] md:max-w-none"
						>
							{currentTrack.name}
						</a>
						<span class="text-primary-opaque text-xs">•</span>
						<span class="text-accent-gold font-medium truncate max-w-[150px] md:max-w-none">
							{currentTrack.artist["#text"]}
						</span>
					</div>

					{/* Song List Grid */}
					<div class="flex flex-wrap gap-y-2 gap-x-4 text-xs text-primary-opaque/75">
						{recentTracks.map((track) => (
							<span>
								{track.artist["#text"]} - {track.name}
							</span>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
