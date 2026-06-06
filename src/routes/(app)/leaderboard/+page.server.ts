import { env } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	// The leaderboard is a Novem visualization embedded as an iframe. Set the
	// URL once it exists; until then the page shows a placeholder.
	return { embedUrl: env.PUBLIC_LEADERBOARD_EMBED_URL ?? '' };
};
