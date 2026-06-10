import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import Icons from 'unplugin-icons/vite';

export default defineConfig({
	// Icons are compiled to inline SVG Svelte components at build time (SSR-safe,
	// tree-shaken). Use any Iconify set via `~icons/<set>/<name>`; we use game-icons.
	plugins: [tailwindcss(), sveltekit(), Icons({ compiler: 'svelte' })],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
