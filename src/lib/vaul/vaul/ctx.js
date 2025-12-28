import { getOptionUpdater } from "../internal/helpers/options.js";
import { createVaul } from "../internal/vaul.js";
import { getContext, setContext } from "svelte";
const VAUL_ROOT = Symbol("VAUL_ROOT");
export function setCtx(props = {}, rootProps = {}) {
    const vaul = createVaul(props);
    const updateOption = getOptionUpdater(vaul.options);
    const ctx = { ...vaul, updateOption, rootProps };
    setContext(VAUL_ROOT, ctx);
    return ctx;
}
export function getCtx() {
    return getContext(VAUL_ROOT);
}
