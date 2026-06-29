import { Image } from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageNodeView from './ImageNodeView.jsx';

// Extends the base Image node with an editable caption and a React node view,
// serializing to <figure class="ds-figure"><img><figcaption>…</figcaption></figure>.
// Draggable so photos can be reordered within the entry. Falls back to parsing
// legacy bare <img> (v0.2 entries) with an empty caption.
export const CaptionedImage = Image.extend({
  name: 'image',
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: '',
        // Caption is rendered as a <figcaption>, not an <img> attribute.
        renderHTML: () => ({}),
        parseHTML: () => undefined,
      },
      // Display width in px (null = full/natural). Rendered as the img width attr.
      width: {
        default: null,
        parseHTML: (el) => {
          const w = el.getAttribute('width');
          return w ? parseInt(w, 10) : null;
        },
        renderHTML: (attrs) => (attrs.width ? { width: attrs.width } : {}),
      },
      // Horizontal placement: center (block) | left | right (float, text wraps).
      align: {
        default: 'center',
        parseHTML: () => undefined, // set from the <figure> in getAttrs below
        renderHTML: () => ({}), // rendered on the <figure>, not the <img>
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure.ds-figure',
        getAttrs: (el) => {
          const img = el.querySelector('img');
          if (!img) return false;
          const cap = el.querySelector('figcaption');
          const w = img.getAttribute('width');
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            caption: cap ? cap.textContent : '',
            width: w ? parseInt(w, 10) : null,
            align: el.getAttribute('data-align') || 'center',
          };
        },
      },
      { tag: 'img[src]' }, // legacy bare images
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { caption, align } = node.attrs;
    return [
      'figure',
      { class: `ds-figure ds-align-${align || 'center'}`, 'data-align': align || 'center' },
      ['img', HTMLAttributes],
      ['figcaption', {}, caption || ''],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
