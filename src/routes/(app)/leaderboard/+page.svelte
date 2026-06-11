<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// novem.io only allows same-origin framing (X-Frame-Options: SAMEORIGIN), so a
	// plain cross-origin <iframe> is blocked. Its official embed is a
	// document.write <script> that needs a freshly-parsed document, so we host it
	// in an <iframe srcdoc>. The embed then frames data.novem.io, which permits
	// it, giving the live interactive plot. (Don't revert to a plain <iframe>.)
	const embedHtml = (url: string) => {
		// 'scr' + 'ipt' so no literal <script> token closes this block early.
		const tag = 'scr' + 'ipt';
		return (
			`<!doctype html><html><head><meta charset="utf-8">` +
			`<style>html,body{margin:0;height:100%;overflow:hidden}</style></head>` +
			`<body><${tag} src="${url}"></${tag}></body></html>`
		);
	};
</script>

<section>
	<h1 class="font-display text-3xl font-bold">Leaderboard</h1>
	<p class="mt-1 text-sm text-gray-600">
		Rankings are computed and rendered by Novem, embedded here as a live visualization.
	</p>

	<div class="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
		{#if data.embedUrl}
			<iframe
				srcdoc={embedHtml(data.embedUrl)}
				title="Leaderboard"
				class="h-[600px] w-full"
				loading="lazy"
			></iframe>
		{:else}
			<div class="flex h-[300px] flex-col items-center justify-center gap-2 p-6 text-center">
				<p class="font-medium text-gray-700">Novem visualization goes here.</p>
				<p class="max-w-md text-sm text-gray-500">
					Set <code class="rounded bg-gray-100 px-1">PUBLIC_LEADERBOARD_EMBED_URL</code> to the
					Novem plot's <code class="rounded bg-gray-100 px-1">.js</code> embed URL and it will render
					here.
				</p>
			</div>
		{/if}
	</div>
</section>
