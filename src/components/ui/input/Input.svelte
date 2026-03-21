<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		class: class_ = "",
		value = $bindable(),
		onfocus,
		...rest
	}: HTMLInputAttributes = $props()

	function handleFocus(e: FocusEvent & { currentTarget: HTMLInputElement }) {
		onfocus?.(e);
		const el = e.currentTarget;
		const vv = window.visualViewport;
		if (!vv) {
			setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
			return;
		}
		function scrollToVisible() {
			const rect = el.getBoundingClientRect();
			const visibleBottom = vv!.offsetTop + vv!.height;
			if (rect.bottom > visibleBottom || rect.top < vv!.offsetTop) {
				el.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}
		setTimeout(scrollToVisible, 300);
	}
</script>

<input
	class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {class_}"
	{value}
	onfocus={handleFocus}
	{...rest}
>