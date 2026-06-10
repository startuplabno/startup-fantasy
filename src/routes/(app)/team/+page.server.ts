import type { PageServerLoad } from './$types';
import { getPlayersByIds } from '$lib/server/players';
import { getPlayerPoints } from '$lib/server/scores';
import { getTeam } from '$lib/server/teams';

export const load: PageServerLoad = async ({ locals }) => {
	const team = await getTeam(locals.user!.id);
	if (!team) {
		return { team: null, players: [], points: {}, totalPoints: 0 };
	}

	const players = await getPlayersByIds(team.playerIds);
	const points = await getPlayerPoints(team.playerIds);
	const totalPoints = Object.values(points).reduce((sum, p) => sum + p, 0);

	return {
		team: { name: team.name, status: team.status, lockedAt: team.lockedAt },
		players,
		points,
		totalPoints
	};
};
