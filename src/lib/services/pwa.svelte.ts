// Captures the browser's `beforeinstallprompt` event at startup so the in-app
// install button can trigger native installation on demand. The event fires
// early in page load (before menus mount), so it has to be captured app-wide
// and stashed, then replayed when the user clicks "Install".

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

let deferredPrompt = $state<BeforeInstallPromptEvent | undefined>(undefined);
let installed = $state(false);

export function initPwaInstall() {
	if (typeof window === "undefined") return;

	window.addEventListener("beforeinstallprompt", (event) => {
		// Prevent the mini-infobar so we can offer install from our own UI.
		event.preventDefault();
		deferredPrompt = event as BeforeInstallPromptEvent;
	});

	window.addEventListener("appinstalled", () => {
		installed = true;
		deferredPrompt = undefined;
	});
}

export function canInstall(): boolean {
	return deferredPrompt !== undefined && !installed;
}

export async function promptInstall() {
	const event = deferredPrompt;
	if (!event) return;

	await event.prompt();
	await event.userChoice;
	// A prompt can only be used once; drop it regardless of the choice.
	deferredPrompt = undefined;
}
