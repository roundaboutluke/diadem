<script>import { onMount } from "svelte";
import { getCtx } from "../ctx.js";
const {
  states: { visible },
  methods: { scaleBackground, restorePositionSetting }
} = getCtx();
onMount(() => {
  const raf = requestAnimationFrame(() => {
    visible.set(true);
  });
  return () => {
    cancelAnimationFrame(raf);
    scaleBackground(false);
    restorePositionSetting();
  };
});
</script>
