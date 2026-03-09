import { useEffect, useState } from "preact/hooks";
import {
	getTopArtists,
	getTopAlbums,
	getTopTracks,
	type TopArtist,
	type TopAlbum,
	type TopTrack,
} from "../lib/lastfm";

const PERIODS = [
	{ value: "7day", label: "7 days" },
	{ value: "1month", label: "30 days" },
	{ value: "3month", label: "90 days" },
	{ value: "6month", label: "180 days" },
	{ value: "12month", label: "365 days" },
	{ value: "overall", label: "all time" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

export default function TopListens() {
	const [period, setPeriod] = useState<Period>("3month");
	const [artists, setArtists] = useState<TopArtist[]>([]);
	const [albums, setAlbums] = useState<TopAlbum[]>([]);
	const [tracks, setTracks] = useState<TopTrack[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		Promise.all([
			getTopArtists(5, period),
			getTopAlbums(5, period),
			getTopTracks(5, period),
		]).then(([a, al, t]) => {
			setArtists(a);
			setAlbums(al);
			setTracks(t);
			setLoading(false);
		});
	}, [period]);

	const selectedLabel = PERIODS.find((p) => p.value === period)?.label;

	return (
		<section class="space-y-6">
			<h2 class="flex items-center gap-2 text-primary font-medium tracking-wide">
				top of the last
				<select
					value={period}
					onChange={(e) => setPeriod((e.target as HTMLSelectElement).value as Period)}
					class="bg-transparent border-b border-white/20 text-primary font-medium tracking-wide cursor-pointer hover:border-white/40 focus:outline-none transition-colors pb-px"
				>
					{PERIODS.map((p) => (
						<option key={p.value} value={p.value} class="bg-darkblue-200 text-primary">
							{p.label}
						</option>
					))}
				</select>
			</h2>

			<div class={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-opacity duration-200 ${loading ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
				{/* Artists */}
				<div class="space-y-4">
					<h3 class="text-xs font-bold text-primary-opaque tracking-wider border-b border-white/5 pb-2">
						top artists
					</h3>
					<div class="space-y-3">
						{artists.map((artist) => (
							<div key={artist.url} class="flex items-center justify-between text-sm group">
								<a
									href={artist.url}
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary-opaque group-hover:text-primary transition-colors truncate pr-2"
								>
									{artist.name.toLowerCase()}
								</a>
								<span class="text-accent-gold text-xs font-medium shrink-0">
									{artist.playcount} plays
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Albums */}
				<div class="space-y-4">
					<h3 class="text-xs font-bold text-primary-opaque tracking-wider border-b border-white/5 pb-2">
						top albums
					</h3>
					<div class="space-y-3">
						{albums.map((album) => (
							<div key={album.url} class="flex items-center justify-between text-sm group">
								<a
									href={album.url}
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary-opaque group-hover:text-primary transition-colors truncate pr-2"
									title={`${album.name} by ${album.artist.name}`}
								>
									{album.name.toLowerCase()}
								</a>
								<span class="text-accent-gold text-xs font-medium shrink-0">
									{album.playcount} plays
								</span>
							</div>
						))}
					</div>
				</div>

				{/* Tracks */}
				<div class="space-y-4">
					<h3 class="text-xs font-bold text-primary-opaque tracking-wider border-b border-white/5 pb-2">
						top tracks
					</h3>
					<div class="space-y-3">
						{tracks.map((track) => (
							<div key={track.url} class="flex items-center justify-between text-sm group">
								<a
									href={track.url}
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary-opaque group-hover:text-primary transition-colors truncate pr-2"
									title={`${track.name} by ${track.artist.name}`}
								>
									{track.name.toLowerCase()}
								</a>
								<span class="text-accent-gold text-xs font-medium shrink-0">
									{track.playcount} plays
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
