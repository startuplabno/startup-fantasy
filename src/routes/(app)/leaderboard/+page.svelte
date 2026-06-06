<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section>
	<h1 class="text-2xl font-bold">Leaderboard</h1>
	<p class="mt-1 text-sm text-gray-600">
		Rankings are computed and rendered by Novem, embedded here as a live visualization.
	</p>

	<div class="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
		{#if data.embedUrl}
			<iframe src={data.embedUrl} title="Leaderboard" class="h-[600px] w-full" loading="lazy"
			></iframe>
		{:else}
			<div class="flex h-[300px] flex-col items-center justify-center gap-2 p-6 text-center">
				<p class="font-medium text-gray-700">Novem visualization goes here.</p>
				<p class="max-w-md text-sm text-gray-500">
					Set <code class="rounded bg-gray-100 px-1">PUBLIC_LEADERBOARD_EMBED_URL</code> to the Novem
					plot/grid URL and it will render in this iframe.
				</p>
			</div>
		{/if}
	</div>
</section>
