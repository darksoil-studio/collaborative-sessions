import { css } from 'lit';

// From prosmirror-view/style/prosemirror.css
export const prosemirrorStyles = css`
	.ProseMirror {
		position: relative;
	}

	.ProseMirror {
		word-wrap: break-word;
		white-space: pre-wrap;
		white-space: break-spaces;
		-webkit-font-variant-ligatures: none;
		font-variant-ligatures: none;
		font-feature-settings: 'liga' 0; /* the above doesn't seem to work in Edge */
	}

	.ProseMirror pre {
		white-space: pre-wrap;
	}

	.ProseMirror li {
		position: relative;
	}

	.ProseMirror-hideselection *::selection {
		background: transparent;
	}
	.ProseMirror-hideselection *::-moz-selection {
		background: transparent;
	}
	.ProseMirror-hideselection {
		caret-color: transparent;
	}

	/* See https://github.com/ProseMirror/prosemirror/issues/1421#issuecomment-1759320191 */
	.ProseMirror [draggable][contenteditable='false'] {
		user-select: text;
	}

	.ProseMirror-selectednode {
		outline: 2px solid #8cf;
	}

	/* Make sure li selections wrap around markers */

	li.ProseMirror-selectednode {
		outline: none;
	}

	li.ProseMirror-selectednode:after {
		content: '';
		position: absolute;
		left: -32px;
		right: -2px;
		top: -2px;
		bottom: -2px;
		border: 2px solid #8cf;
		pointer-events: none;
	}

	/* Protect against generic img rules */

	img.ProseMirror-separator {
		display: inline !important;
		border: none !important;
		margin: 0 !important;
	}
`;

// From prosemirror-menu/styles/menu.css
export const prosemirrorMenuStyles = css`
	.ProseMirror-textblock-dropdown {
		min-width: 3em;
	}

	.ProseMirror-menu {
		margin: 0 -4px;
		line-height: 1;
	}

	.ProseMirror-tooltip .ProseMirror-menu {
		width: -webkit-fit-content;
		width: fit-content;
		white-space: pre;
	}

	.ProseMirror-menuitem {
		margin-right: 3px;
		display: inline-block;
	}

	.ProseMirror-menuseparator {
		border-right: 1px solid #ddd;
		margin-right: 3px;
	}

	.ProseMirror-menu-dropdown,
	.ProseMirror-menu-dropdown-menu {
		font-size: 90%;
		white-space: nowrap;
	}

	.ProseMirror-menu-dropdown {
		vertical-align: 1px;
		cursor: pointer;
		position: relative;
		padding-right: 15px;
	}

	.ProseMirror-menu-dropdown-wrap {
		padding: 1px 0 1px 4px;
		display: inline-block;
		position: relative;
	}

	.ProseMirror-menu-dropdown:after {
		content: '';
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-top: 4px solid currentColor;
		opacity: 0.6;
		position: absolute;
		right: 4px;
		top: calc(50% - 2px);
	}

	.ProseMirror-menu-dropdown-menu,
	.ProseMirror-menu-submenu {
		position: absolute;
		background: white;
		color: #666;
		border: 1px solid #aaa;
		padding: 2px;
	}

	.ProseMirror-menu-dropdown-menu {
		z-index: 15;
		min-width: 6em;
	}

	.ProseMirror-menu-dropdown-item {
		cursor: pointer;
		padding: 2px 8px 2px 4px;
	}

	.ProseMirror-menu-dropdown-item:hover {
		background: #f2f2f2;
	}

	.ProseMirror-menu-submenu-wrap {
		position: relative;
		margin-right: -4px;
	}

	.ProseMirror-menu-submenu-label:after {
		content: '';
		border-top: 4px solid transparent;
		border-bottom: 4px solid transparent;
		border-left: 4px solid currentColor;
		opacity: 0.6;
		position: absolute;
		right: 4px;
		top: calc(50% - 4px);
	}

	.ProseMirror-menu-submenu {
		display: none;
		min-width: 4em;
		left: 100%;
		top: -3px;
	}

	.ProseMirror-menu-active {
		background: #eee;
		border-radius: 4px;
	}

	.ProseMirror-menu-disabled {
		opacity: 0.3;
	}

	.ProseMirror-menu-submenu-wrap:hover .ProseMirror-menu-submenu,
	.ProseMirror-menu-submenu-wrap-active .ProseMirror-menu-submenu {
		display: block;
	}

	.ProseMirror-menubar {
		border-top-left-radius: inherit;
		border-top-right-radius: inherit;
		position: relative;
		min-height: 1em;
		color: #666;
		padding: 1px 6px;
		top: 0;
		left: 0;
		right: 0;
		border-bottom: 1px solid silver;
		background: white;
		z-index: 10;
		-moz-box-sizing: border-box;
		box-sizing: border-box;
		overflow: visible;
	}

	.ProseMirror-icon {
		display: inline-block;
		line-height: 0.8;
		vertical-align: -2px; /* Compensate for padding */
		padding: 2px 8px;
		cursor: pointer;
	}

	.ProseMirror-menu-disabled.ProseMirror-icon {
		cursor: default;
	}

	.ProseMirror-icon svg {
		fill: currentColor;
		height: 1em;
	}

	.ProseMirror-icon span {
		vertical-align: text-top;
	}
`;
