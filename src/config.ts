import tmsyncImg from "./assets/tmsync.jpeg";
import chrolloImg from "./assets/chrollo.png";

export const userConfig = {
	socials: [
		{
			name: "github",
			url: "https://github.com/kasusoba",
		},
		{
			name: "anilist",
			url: "https://anilist.co/user/kasusoba/",
		},
		{
			name: "last.fm",
			url: "https://www.last.fm/user/kasusoba/",
		},
		{
			name: "trakt",
			url: "https://trakt.tv/users/kasusoba",
		},
		{
			name: "letterboxd",
			url: "https://letterboxd.com/kasusoba/",
		},
		{
			name: "ib",
			url: "https://infinitebacklog.net/users/kasusoba",
		},
		{
			name: "setlist.fm",
			url: "https://www.setlist.fm/user/kasusoba",
		},
	],
	projects: [
		{
			title: "tmsync",
			category: "web extension",
			description:
				"auto track movie and tv show you're watching on 'streaming services' to trakt.tv. malsync for movie and tv show basically",
			url: "https://github.com/kasusoba/tmsync",
			image: tmsyncImg,
		},
		{
			title: "chrollo",
			category: "discord bot",
			description:
				"upload photos and videos in a channel to google photos automatically",
			url: "https://github.com/kasusoba/chrollo",
			image: chrolloImg,
		},
		{
			title: "trying to make more",
			category: "i think",
			description: "fr",
			url: "https://github.com/kasusoba/",
			image: null,
		},
	],
};
