import type { PageServerLoad } from './$types';
import { getTeam } from '$lib/server/teams';
import { getPlayersByIds } from '$lib/server/players';

export const load: PageServerLoad = async ({ locals }) => {
	const team = await getTeam(locals.user!.id);
	if (!team) {
		return { team: null, players: [] };
	}

	return {
		team: { name: team.name, status: team.status, lockedAt: team.lockedAt },
		players: await getPlayersByIds(team.playerIds)
	};
};
