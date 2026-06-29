import { useEffect, useReducer, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CaptionedImage } from './CaptionedImage';
import { FontStyles } from './FontStyles';
import './RichEditor.css';

const FONTS = [
  { label: 'Default', value: '' },
  { label: 'Handwritten', value: 'Caveat, cursive' },
  { label: 'Serif', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Mono', value: 'ui-monospace, "Courier New", monospace' },
];
const SIZES = [
  { label: 'S', value: '13px' },
  { label: 'M', value: '' },
  { label: 'L', value: '20px' },
  { label: 'XL', value: '28px' },
];

const EMOJIS = [
  '😀','😄','🥰','😍','😎','🤔','😌','😢','😭','😴','🥳','😇',
  '👍','👏','🙏','💪','✨','🔥','🌟','💛','💜','💖','💔','❤️',
  '🌸','🌷','🌻','🌈','☀️','🌙','⭐','☔','❄️','🍂','🌊','🏖️',
  '☕','🍰','🍓','🍕','🥗','🍷','🎂','🎁','📖','✍️','📷','🎵',
  '🐶','🐱','🐦','🦋','🌿','🪴','🏡','🚗','✈️','💤','💡','✅',
];

// Re-render the toolbar when selection/content changes so isActive() stays fresh.
function useEditorTick(editor) {
  const [, tick] = useReducer((n) => n + 1, 0);
  useEffect(() => {
    if (!editor) return;
    editor.on('transaction', tick);
    return () => editor.off('transaction', tick);
  }, [editor]);
}

function Btn({ on, active, children, title }) {
  return (
    <button
      type="button"
      className={`tool ${active ? 'on' : ''}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={on}
      title={title}
    >
      {children}
    </button>
  );
}

export default function RichEditor({ value, onChange, placeholder, uploadImage }) {
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const emojiRef = useRef(null);
  const fileRef = useRef(null);

  // Keep the latest uploader, setter, and editor in refs so the editorProps
  // handlers (created once) never close over stale values.
  const uploadRef = useRef(uploadImage);
  uploadRef.current = uploadImage;
  const busyRef = useRef(setUploading);
  busyRef.current = setUploading;
  const editorRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      FontStyles,
      CaptionedImage.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({ placeholder: placeholder || 'Dear diary… ✨' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      // Drop image files anywhere in the entry → upload + insert at the drop point.
      handleDrop(view, event, _slice, moved) {
        if (moved) return false; // internal node move (reorder) — let ProseMirror handle it
        const imgs = imageFiles(event.dataTransfer?.files);
        if (!imgs.length || !uploadRef.current) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? null;
        uploadAndInsert(editorRef.current, imgs, pos, uploadRef, busyRef);
        return true;
      },
      // Paste an image from the clipboard → upload + insert at the cursor.
      handlePaste(view, event) {
        const imgs = imageFiles(event.clipboardData?.files);
        if (!imgs.length || !uploadRef.current) return false;
        event.preventDefault();
        uploadAndInsert(editorRef.current, imgs, null, uploadRef, busyRef);
        return true;
      },
    },
  });

  useEditorTick(editor);
  editorRef.current = editor;

  // close emoji popover on outside click
  useEffect(() => {
    const h = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setEmojiOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!editor) return null;

  const insertEmoji = (e) => {
    editor.chain().focus().insertContent(e).run();
    setEmojiOpen(false);
  };
  const setLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL:', prev);
    if (url === null) return;
    if (url === '') return editor.chain().focus().unsetLink().run();
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const onPickFile = async (e) => {
    const imgs = imageFiles(e.target.files);
    e.target.value = '';
    if (!imgs.length || !uploadImage) return;
    await uploadAndInsert(editor, imgs, null, uploadRef, busyRef);
  };

  return (
    <div className="rich">
      <div className="toolbar" role="toolbar" aria-label="Formatting">
        <Btn on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><b>B</b></Btn>
        <Btn on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><i>I</i></Btn>
        <Btn on={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><u>U</u></Btn>
        <Btn on={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><s>S</s></Btn>
        <Btn on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading">H</Btn>
        <select
          className="tool-select"
          title="Font"
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const v = e.target.value;
            v ? editor.chain().focus().setFontFamily(v).run()
              : editor.chain().focus().unsetFontFamily().run();
          }}
        >
          {FONTS.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
        </select>
        <select
          className="tool-select size"
          title="Font size"
          value={editor.getAttributes('textStyle').fontSize || ''}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const v = e.target.value;
            v ? editor.chain().focus().setFontSize(v).run()
              : editor.chain().focus().unsetFontSize().run();
          }}
        >
          {SIZES.map((s) => <option key={s.label} value={s.value}>{s.label}</option>)}
        </select>
        <label className="tool color" title="Text color">
          🎨
          <input
            type="color"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            value={editor.getAttributes('textStyle').color || '#5b5566'}
          />
        </label>
        <Btn on={() => editor.chain().focus().toggleHighlight({ color: '#FBEFC0' }).run()} active={editor.isActive('highlight')} title="Highlight">🖍️</Btn>
        <Btn on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">•</Btn>
        <Btn on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">1.</Btn>
        <Btn on={setLink} active={editor.isActive('link')} title="Link">🔗</Btn>
        <Btn on={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">⬅</Btn>
        <Btn on={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">⬌</Btn>
        <div className="emoji-wrap" ref={emojiRef}>
          <Btn on={() => setEmojiOpen((o) => !o)} active={emojiOpen} title="Emoji">😊</Btn>
          {emojiOpen && (
            <div className="emoji-pop">
              {EMOJIS.map((e) => (
                <button key={e} type="button" className="emoji-item" onClick={() => insertEmoji(e)}>{e}</button>
              ))}
            </div>
          )}
        </div>
        {uploadImage && (
          <Btn on={() => fileRef.current?.click()} active={uploading} title="Add photo(s)">
            {uploading ? '⏳' : '📷'}
          </Btn>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPickFile} />
      </div>
      <EditorContent editor={editor} className="rich-content" />
    </div>
  );
}

// Imperative helper so the parent can insert an uploaded image.
export function insertImage(editor, src) {
  editor?.chain().focus().setImage({ src }).run();
}

const imageFiles = (fileList) => [...(fileList || [])].filter((f) => /^image\//.test(f.type));

// Upload all images (sequentially, so order is preserved), then insert them as
// image nodes in one ordered insertContent at the cursor (or at `pos` for a drop).
async function uploadAndInsert(editor, files, pos, uploadRef, busyRef) {
  if (!editor) return;
  busyRef.current(true);
  try {
    const urls = [];
    for (const file of files) {
      try {
        urls.push(await uploadRef.current(file));
      } catch (err) {
        alert('Photo upload failed: ' + (err.message || 'try again'));
      }
    }
    if (!urls.length) return;
    const nodes = urls.map((src) => ({ type: 'image', attrs: { src } }));
    const chain = editor.chain().focus();
    if (pos != null) chain.setTextSelection(pos);
    chain.insertContent(nodes).run();
  } finally {
    busyRef.current(false);
  }
}
