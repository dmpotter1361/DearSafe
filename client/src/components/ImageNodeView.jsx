import { NodeViewWrapper } from '@tiptap/react';

// React node view for an inline photo: the image + an editable caption,
// a drag handle (reorder), and a remove button. Read-only when not editable.
export default function ImageNodeView({ node, updateAttributes, deleteNode, editor, selected }) {
  const { src, alt, caption } = node.attrs;
  const editable = editor.isEditable;

  return (
    <NodeViewWrapper as="figure" className={`ds-figure ${selected ? 'sel' : ''}`}>
      <div className="ds-figure-imgwrap">
        {editable && (
          <span className="ds-figure-handle" contentEditable={false} data-drag-handle title="Drag to reorder">⠿</span>
        )}
        <img src={src} alt={alt || caption || ''} draggable={false} />
        {editable && (
          <button
            type="button"
            className="ds-figure-del"
            contentEditable={false}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => deleteNode()}
            title="Remove photo"
          >
            ✕
          </button>
        )}
      </div>
      {editable ? (
        <input
          className="ds-figure-cap"
          contentEditable={false}
          value={caption || ''}
          placeholder="Add a caption…"
          onChange={(e) => updateAttributes({ caption: e.target.value })}
          onKeyDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        caption ? <figcaption className="ds-figure-cap-static">{caption}</figcaption> : null
      )}
    </NodeViewWrapper>
  );
}
