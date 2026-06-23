<script lang="ts">
	import * as m from "@/lib/paraglide/messages";
	import { Download } from "lucide-svelte";
	import Button from "@/components/ui/input/Button.svelte";
	import { canInstall, promptInstall } from "@/lib/services/pwa.svelte";
</script>

{#if canInstall()}
	<Button
		variant="outline"
		size=""
		class="w-full justify-start gap-3 px-4 py-3 h-auto rounded-lg"
		onclick={promptInstall}
	>
		<Download size="20" class="shrink-0" />
		<div class="flex flex-col items-start text-left">
			<span class="font-medium">{m.install_app()}</span>
			<span class="text-muted-foreground text-sm font-normal">{m.install_app_description()}</span>
		</div>
	</Button>
{/if}
