<script lang="ts">
	import { playerPhotoUrl } from '$lib/game/players';

	let { id, name, size = 32 }: { id: string; name: string; size?: number } = $props();

	let failed = $state(false);

	const initials = $derived(
		name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('')
	);

	// The CDN returns a fully-transparent PNG placeholder (HTTP 200) for player
	// IDs it doesn't recognise, so onerror never fires for them. Sample the
	// centre pixel via a 1×1 canvas: if it's transparent the image is the
	// placeholder and we fall back to initials instead.
	function onLoaded(img: HTMLImageElement) {
		try {
			const canvas = document.createElement('canvas');
			canvas.width = 1;
			canvas.height = 1;
			const ctx = canvas.getContext('2d')!;
			ctx.drawImage(
				img,
				Math.floor(img.naturalWidth / 2),
				Math.floor(img.naturalHeight / 2),
				1,
				1,
				0,
				0,
				1,
				1
			);
			if (ctx.getImageData(0, 0, 1, 1).data[3] === 0) failed = true;
		} catch {
			// Canvas blocked or tainted — leave the image as-is.
		}
	}
</script>

{#if failed}
	<span
		aria-hidden="true"
		class="flex shrink-0 items-center justify-center rounded-full bg-brand-pink text-xs font-semibold text-brand-dark"
		style="width: {size}px; height: {size}px"
	>
		{initials}
	</span>
{:else}
	<img
		src={playerPhotoUrl(id)}
		alt={name}
		width={size}
		height={size}
		loading="lazy"
		crossorigin="anonymous"
		onerror={() => (failed = true)}
		onload={(e) => onLoaded(e.currentTarget as HTMLImageElement)}
		class="shrink-0 rounded-full bg-gray-100 object-cover"
		style="width: {size}px; height: {size}px"
	/>
{/if}
