import { Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

export default function placeholder(text: string) {
	const update = (view: EditorView) => {
		if (view.state.doc.textContent) {
			view.dom.removeAttribute('data-placeholder');
		} else {
			view.dom.setAttribute('data-placeholder', text);
		}
	};

	return new Plugin({
		view(view) {
			update(view);

			return { update };
		},
	});
}
