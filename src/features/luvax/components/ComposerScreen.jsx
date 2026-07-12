import { useState, useMemo } from 'react';
import { v } from '../constants/tokens';
import { SUGGESTED_TAGS } from '../constants/data';
import { LxIcon, LxAvatar, LxTag, LxDivider } from './primitives';
import { useCreatePost } from '../hooks/usePosts';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { useRef } from 'react';

// ─── Composer Screen ───────────────────────────────────────────────────────
export function ComposerScreen({ navigate }) {
  const [type, setType] = useState('text');
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const maxChars = 280;

  const { uploadMedia, isUploading, progress } = useMediaUpload();

  const captionTags = useMemo(() => {
    const matches = caption.match(/#(\w+)/g) || [];
    return matches.map(m => m.slice(1).toLowerCase());
  }, [caption]);

  const allTags = Array.from(new Set([...captionTags, ...selectedTags]));

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertTag = (tag) => {
    const regex = new RegExp(`#${tag}(?![A-Za-z0-9_])`, 'gi');
    if (regex.test(caption)) {
      setCaption(c => c.replace(regex, '').replace(/[ \t]{2,}/g, ' ').trim());
    } else {
      setCaption(c => c ? `${c} #${tag}` : `#${tag}`);
    }
  };

  const createPostMutation = useCreatePost();

  const handlePost = async () => {
    // If photo or video is selected but no file, block
    if ((type === 'photo' || type === 'video') && !file) {
      alert(`Please select a ${type} to post.`);
      return;
    }

    try {
      let mediaIds = [];
      // Upload media if present
      if (file) {
        const mediaAsset = await uploadMedia(file);
        mediaIds = [mediaAsset.id];
      }
      
      // Map frontend type to backend PostType
      const backendPostType = type === 'photo' ? 'IMAGE' : type === 'video' ? 'VIDEO' : 'TEXT';

      // Convert to proper backend format
      const payload = {
        caption: caption,
        postType: backendPostType,
        mediaIds: mediaIds.length > 0 ? mediaIds : null, // Backend accepts null or empty list for TEXT
      };

      createPostMutation.mutate(payload, {
        onSuccess: () => {
          setCaption('');
          setFile(null);
          setPreviewUrl(null);
          navigate('feed');
        },
        onError: (err) => {
          alert("Failed to post: " + err.message);
        }
      });
    } catch (err) {
      alert("Failed to upload media: " + err.message);
    }
  };

  const isActionDisabled = createPostMutation.isPending || isUploading || ((type === 'photo' || type === 'video') && !file) || (type === 'text' && !caption.trim());

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px', borderBottom: `1px solid ${v.border}`,
        background: v.base,
      }}>
        <span style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 500, color: v.ink2 }}>new post</span>
        <button onClick={handlePost} disabled={isActionDisabled}
          style={{
            fontFamily: v.fontBody, fontSize: 14, fontWeight: 600,
            background: isActionDisabled ? v.surfaceRaised : v.accent,
            color: isActionDisabled ? v.ink3 : v.inkInverse,
            border: 'none', borderRadius: 999, padding: '7px 16px',
            cursor: isActionDisabled ? 'default' : 'pointer',
          }}>
          {isUploading ? `uploading ${progress}%` : (createPostMutation.isPending ? 'posting...' : 'post it')}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        {/* Type tabs */}
        <div style={{
          display: 'flex', gap: 0, padding: '12px 16px 4px',
          borderBottom: `1px solid ${v.border}`,
        }}>
          {[['text', 'type', 'text'], ['photo', 'image', 'photo'], ['video', 'video', 'video']].map(([t, ic, label]) => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 0',
              borderBottom: type === t ? `2px solid ${v.ink}` : '2px solid transparent',
              marginBottom: -1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: v.fontBody, fontSize: 13, fontWeight: type === t ? 600 : 500,
              color: type === t ? v.ink : v.ink3,
            }}>
              <LxIcon name={ic} size={16} color={type === t ? v.ink : v.ink3} />
              {label}
            </button>
          ))}
        </div>

        {/* Author + composer */}
        <div style={{ display: 'flex', gap: 12, padding: '20px 16px 0' }}>
          <LxAvatar size={36} idx={0} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 600, color: v.ink, marginBottom: 8 }}>you</div>

            {/* Hidden file input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept={type === 'photo' ? "image/*" : "video/*"}
              onChange={handleFileChange} 
            />

            {type === 'photo' && (
              <div 
                onClick={() => !file && fileInputRef.current.click()}
                style={{
                  aspectRatio: '4/5', background: v.surfaceSunken,
                  borderRadius: 12, border: previewUrl ? 'none' : `1px dashed ${v.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: file ? 'default' : 'pointer', marginBottom: 14, position: 'relative', overflow: 'hidden'
                }}>
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={removeFile} style={{ position: 'absolute', top: 8, right: 8, background: v.black50, border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer' }}>
                      <LxIcon name="close" size={16} color={v.white} />
                    </button>
                  </>
                ) : (
                  <>
                    <LxIcon name="image" size={36} color={v.ink3} />
                    <span style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink2 }}>tap to add a photo</span>
                    <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>jpg, png · max 10MB</span>
                  </>
                )}
              </div>
            )}
            {type === 'video' && (
              <div 
                onClick={() => !file && fileInputRef.current.click()}
                style={{
                  aspectRatio: '4/5', background: v.surfaceSunken,
                  borderRadius: 12, border: previewUrl ? 'none' : `1px dashed ${v.border}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: file ? 'default' : 'pointer', marginBottom: 14, position: 'relative', overflow: 'hidden'
                }}>
                {previewUrl ? (
                  <>
                    <video src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                    <button onClick={removeFile} style={{ position: 'absolute', top: 8, right: 8, background: v.black50, border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer', zIndex: 10 }}>
                      <LxIcon name="close" size={16} color={v.white} />
                    </button>
                  </>
                ) : (
                  <>
                    <LxIcon name="video" size={36} color={v.ink3} />
                    <span style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink2 }}>tap to add a video</span>
                    <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>mp4 · max 60s · 50MB</span>
                  </>
                )}
              </div>
            )}

            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value.slice(0, maxChars))}
              placeholder={type === 'text' ? 'say something real...' : 'add a caption (optional)'}
              style={{
                width: '100%', fontFamily: v.fontBody,
                fontSize: type === 'text' ? 17 : 14, color: v.ink,
                background: 'transparent', border: 'none', outline: 'none',
                resize: 'none', lineHeight: 1.55, letterSpacing: '-0.01em',
                minHeight: type === 'text' ? 120 : 60, padding: 0,
              }}
            />
          </div>
        </div>

        {/* Hashtag suggestions */}
        <div style={{ padding: '8px 16px 4px', marginLeft: 48 }}>
          <div style={{ fontFamily: v.fontMono, fontSize: 9, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <LxIcon name="hash" size={12} color={v.ink3} />
            hashtags {allTags.length > 0 && <span style={{ color: v.accentText, marginLeft: 4 }}>({allTags.length})</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SUGGESTED_TAGS.map(t => (
              <LxTag key={t} active={allTags.includes(t)} onClick={() => insertTag(t)}>
                #{t}
              </LxTag>
            ))}
          </div>
        </div>

        <LxDivider />

        {/* Bottom action bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>
            <LxIcon name="hash" size={13} color={v.ink3} />
            <span>auto-tagged: {captionTags.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {caption.length > 0 && (
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: `conic-gradient(var(--lx-accent) ${caption.length / maxChars * 360}deg, var(--lx-surface-raised) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 17, height: 17, borderRadius: '50%', background: v.base }} />
              </div>
            )}
            <span style={{
              fontFamily: v.fontMono, fontSize: 11,
              color: caption.length > maxChars * 0.9 ? v.error : v.ink3,
            }}>
              {maxChars - caption.length}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
