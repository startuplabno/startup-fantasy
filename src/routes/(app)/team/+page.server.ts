import type { PageServerLoad } from './$types';
import { getPlayers } from '$lib/game/players';
import { getTeam } from '$lib/server/teams';

export const load: PageServerLoad = async ({ locals }) => {
	const team = await getTeam(locals.user!.id);
	if (!team) {
		return { team: null, players: [] };
	}

	return {
		team: { name: team.name, status: team.status, lockedAt: team.lockedAt },
		players: getPlayers(team.playerIds)
	};
};
