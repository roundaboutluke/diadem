<script>import { Dialog as DialogPrimitive } from "bits-ui";
import { get } from "svelte/store";
import { getCtx } from "../ctx.js";
import Visible from "./visible.svelte";
const {
  refs: { drawerRef },
  states: { visible, keyboardIsOpen, openDrawerIds, drawerId },
  helpers: { getContentStyle },
  methods: { onPress, onDrag, onRelease, closeDrawer },
  options: { direction, dismissible: localDismissible },
  rootProps: { closeOnOutsideClick = true, onOutsideClick, onOpenChange } = {}
} = getCtx();
export let style = "";
let drawerEl = null;
$:
  drawerRef.set(drawerEl ?? void 0);
</script>

<DialogPrimitive.Content
	bind:ref={drawerEl}
	style={$getContentStyle(style)}
	preventScroll={false}
	on:pointerdown={(e) => {
		onPress(e);
	}}
	on:pointerup={(e) => {
		onRelease(e);
	}}
	on:pointermove={(e) => {
		onDrag(e);
	}}
	on:touchend={(e) => {
		onRelease(e);
	}}
	on:touchmove={(e) => {
		onDrag(e);
	}}
	onEscapeKeydown={(e) => {
		e.preventDefault();
	}}
	onInteractOutside={(e) => {
		if (!closeOnOutsideClick) {
			e.preventDefault();
			return;
		}

		onOutsideClick?.(e);

		if (e?.defaultPrevented) return;

		if ($keyboardIsOpen) {
			keyboardIsOpen.set(false);
		}
		e.preventDefault();
		if (!$localDismissible) {
			return;
		}
		const $openDialogIds = get(openDrawerIds);
		const isLast = $openDialogIds[$openDialogIds.length - 1] === get(drawerId);
		if (isLast) {
			onOpenChange?.(false);
			closeDrawer();
		}
	}}
	data-vaul-drawer=""
	data-vaul-drawer-direction={$direction}
	data-vaul-drawer-visible={$visible ? "true" : "false"}
	{...$$restProps}
>
	<Visible />
	<slot />
</DialogPrimitive.Content>
