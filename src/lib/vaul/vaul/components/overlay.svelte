<script>import { Dialog as DialogPrimitive } from "bits-ui";
import { getCtx } from "../ctx.js";
const {
  refs: { overlayRef },
  states: { isOpen, visible, snapPoints, shouldFade },
  methods: { onRelease }
} = getCtx();
let hasSnapPoints = false;
let overlayEl = null;
$:
  hasSnapPoints = $snapPoints && $snapPoints.length > 0;
$:
  overlayRef.set(overlayEl ?? void 0);
</script>

<DialogPrimitive.Overlay {...$$restProps}>
	{#snippet child({ props })}
		<div
			{...props}
			bind:this={overlayEl}
			on:mouseup={onRelease}
			data-vaul-drawer-visible={$visible ? "true" : "false"}
			data-vaul-overlay=""
			data-vaul-snap-points={$isOpen && hasSnapPoints ? "true" : "false"}
			data-vaul-snap-points-overlay={$isOpen && $shouldFade ? "true" : "false"}
		></div>
	{/snippet}
</DialogPrimitive.Overlay>
