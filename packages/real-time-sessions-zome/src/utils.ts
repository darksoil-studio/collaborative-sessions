// NOTE: This scheduling logic is too basic to be useful. Do not copy/paste.
import { Signal } from '@darksoil-studio/holochain-signals';

// This function would usually live in a library/framework, not application code
let pending = false;

const w = new Signal.subtle.Watcher(() => {
	if (!pending) {
		pending = true;
		queueMicrotask(() => {
			pending = false;
			for (const s of w.getPending()) s.get();
			w.watch();
		});
	}
});

// TODO: why do we need to use this complicated effect method?
// An effect effect Signal which evaluates to cb, which schedules a read of
// itself on the microtask queue whenever one of its dependencies might change
export function effect(cb: () => void) {
	let destructor: (() => void) | void;
	const c = new Signal.Computed(() => {
		if (typeof destructor === 'function') {
			destructor();
		}
		destructor = cb();
	});
	w.watch(c);
	c.get();
	return () => {
		if (typeof destructor === 'function') {
			destructor();
		}
		w.unwatch(c);
	};
}
