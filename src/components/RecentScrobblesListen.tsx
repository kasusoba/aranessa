import { useEffect, useState } from "preact/hooks";
import { getRecentTracks, type Track } from "../lib/lastfm";
import { getRelativeTime } from "../lib/utils";

export default function RecentScrobblesListen() {
	const [tracks, setTracks] = useState<Track[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		getRecentTracks(5).then((data) => {
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
									<span class="text-xs text-primary-opaque/50 sm:hidden">
										{isPlaying
											? "now playing"
											: track.date?.uts
												? getRelativeTime(
														new Date(parseInt(track.date.uts, 10) * 1000),
													)
												: ""}
									</span>
								</div>
							</div>
							<span class="hidden sm:block text-xs text-primary-opaque/50 whitespace-nowrap ml-4">
								{isPlaying
									? "now playing"
									: track.date?.uts
										? getRelativeTime(
												new Date(parseInt(track.date.uts, 10) * 1000),
											)
										: ""}
							</span>
						</div>
					);
				})}
			</div>
		</section>
	);
}
