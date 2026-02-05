import { useEffect, useState } from "preact/hooks";
import { getRecentTracks, type Track } from "../lib/lastfm";

function formatTimeAgo(uts?: string) {
	if (!uts) return "";
	const timestamp = parseInt(uts, 10) * 1000;
	const now = Date.now();
	const diff = now - timestamp;

	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export default function RecentScrobblesListen() {
	const [tracks, setTracks] = useState<Track[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getRecentTracks(4).then((data) => {
			setTracks(data);
			setLoading(false);
		});
	}, []);

	if (loading) {
		return (
			<section class="space-y-6 animate-pulse">
				<h2 class="flex items-center gap-2 text-primary font-medium tracking-wide">
					{/* Icon Skeleton */}
					<div class="w-5 h-5 bg-darkblue-200/50 rounded-full"></div>
					<span class="w-32 h-6 bg-darkblue-200/50 rounded"></span>
				</h2>
				<div class="space-y-4">
					{[...Array(5)].map((_, i) => (
						<div key={i} class="flex items-center gap-4">
							<div class="w-12 h-12 bg-darkblue-200/50 rounded-md"></div>
							<div class="flex flex-col gap-2 w-full">
								<div class="w-1/3 h-4 bg-darkblue-200/50 rounded"></div>
								<div class="w-1/4 h-3 bg-darkblue-200/50 rounded"></div>
							</div>
						</div>
					))}
				</div>
			</section>
		);
	}

	return (
		<section class="space-y-6">
			<h2 class="flex items-center gap-2 text-primary font-medium tracking-wide">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="text-accent-blue"
				>
					<title>Recent Scrobbles Icon</title>
					<line x1="12" y1="20" x2="12" y2="10"></line>
					<line x1="18" y1="20" x2="18" y2="4"></line>
					<line x1="6" y1="20" x2="6" y2="16"></line>
				</svg>
				recent scrobbles
			</h2>

			<div class="space-y-4">
				{tracks.map((track) => {
					const isPlaying = track["@attr"]?.nowplaying === "true";
					const albumArt = track.image.find((img) => img.size === "medium")?.[
						"#text"
					];

					return (
						<div
							key={track.url}
							class="flex items-center justify-between group"
						>
							<div class="flex items-center gap-4">
								<div class="w-12 h-12 bg-zinc-800 rounded-md overflow-hidden relative border border-white/5 shrink-0">
									{albumArt ? (
										<img
											src={albumArt}
											alt={track.album["#text"]}
											class="w-full h-full object-cover"
										/>
									) : (
										<div class="w-full h-full bg-stone-700/50 flex items-center justify-center text-xs text-white/20">
											♫
										</div>
									)}
								</div>
								<div class="flex flex-col min-w-0">
									<a
										href={track.url}
										target="_blank"
										rel="noopener noreferrer"
										class="text-sm font-medium text-primary group-hover:text-accent-blue transition-colors truncate max-w-[150px] sm:max-w-xs block"
									>
										{track.name}
									</a>
									<span class="text-xs text-primary-opaque truncate max-w-[150px] sm:max-w-xs block">
										{track.artist["#text"]}
									</span>
								</div>
							</div>
							<span class="text-xs text-primary-opaque/50 whitespace-nowrap ml-4">
								{isPlaying ? "now playing" : formatTimeAgo(track.date?.uts)}
							</span>
						</div>
					);
				})}
			</div>
		</section>
	);
}
