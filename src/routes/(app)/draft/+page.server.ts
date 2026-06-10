import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { validate } from '$lib/game/squad';
import { getTeam, lockTeam } from '$lib/server/teams';
import { getPlayersByIds, listPlayers } from '$lib/server/players';

export const load: PageServerLoad = async ({ locals }) => {
	// locals.user is guaranteed by the (app) layout guard.
	const team = await getTeam(locals.user!.id);
	return {
		teamName: team?.name ?? '',
		selectedIds: team?.playerIds ?? [],
		players: await listPlayers()
	};
};

export const actions: Actions = {
	lock: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const formData = await request.formData();
		const teamName = formData.get('teamName')?.toString().trim() ?? '';

		let selectedIds: string[];
		try {
			selectedIds = JSON.parse(formData.get('selection')?.toString() ?? '[]');
		} catch {
			return fail(400, { teamName, message: 'Could not read your selection.' });
		}

		if (!teamName) {
			return fail(400, { teamName, message: 'Give your team a name.' });
		}

		const players = await getPlayersByIds(selectedIds);
		const issues = validate(players);
		if (issues.length > 0) {
			return fail(400, { teamName, message: issues.map((i) => i.message).join(' ') });
		}

		await lockTeam(userId, teamName, selectedIds);
		return redirect(302, '/team');
	}
};
