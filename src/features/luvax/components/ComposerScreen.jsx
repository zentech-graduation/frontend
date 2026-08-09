import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/constants';
import { v } from '@/config/tokens';
import { SUGGESTED_TAGS } from '../constants/data';
import { LxAvatar, LxDivider, LxIcon, LxTag } from './primitives';
import { useCreatePost } from '../hooks/usePosts';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { useLuvaxTweaks } from '../LuvaxTweaksContext';

const MAX_CHARS = 280;

const clampCaption = (value) => value.slice(0, MAX_CHARS);

export function ComposerScreen() {
  const navigate = useNavigate();
  const { viewport } = useLuvaxTweaks();
  const [type, setType] = useState('text');
  const [caption, setCaption] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef(null);

  const { uploadMedia, isUploading, progress } = useMediaUpload();

  const captionTags = useMemo(() => {
    const matches = caption.match(/#(\w+)/g) || [];
    return matches.map((match) => match.slice(1).toLowerCase());
  }, [caption]);

  const allTags = Array.from(new Set([...captionTags, ...selectedTags]));

  const handleCaptionChange = (value) => {
    setCaption(clampCaption(value));
  };

  const handleFileChange = (event) => {
    const selected = event.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const removeFile = (event) => {
    event.stopPropagation();
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const insertTag = (tag) => {
    const regex = new RegExp(`#${tag}(?![A-Za-z0-9_])`, 'gi');
    if (regex.test(caption)) {
      handleCaptionChange(caption.replace(regex, '').replace(/[ \t]{2,}/g, ' ').trim());
      return;
    }
    handleCaptionChange(caption ? `${caption} #${tag}` : `#${tag}`);
  };

  const createPostMutation = useCreatePost();

  const handlePost = async () => {
    setFormError('');

    if ((type === 'photo' || type === 'video') && !file) {
      setFormError(`please select a ${type} to post.`);
      return;
    }

    try {
      let mediaIds = [];
      if (file) {
        const mediaAsset = await uploadMedia(file);
        mediaIds = [mediaAsset.id];
      }

      const backendPostType = type === 'photo' ? 'IMAGE' : type === 'video' ? 'VIDEO' : 'TEXT';
      const payload = {
        caption,
        postType: backendPostType,
        mediaIds: mediaIds.length > 0 ? mediaIds : null,
      };

      createPostMutation.mutate(payload, {
        onSuccess: () => {
          setCaption('');
          setFile(null);
          setPreviewUrl(null);
          setFormError('');
          navigate(ROUTES.FEED);
        },
        onError: (error) => {
          setFormError(error.message || "we couldn't publish your post. try again.");
        },
      });
    } catch {
      setFormError("we couldn't upload your media. try again.");
    }
  };

  const isActionDisabled = createPostMutation.isPending || isUploading || ((type === 'photo' || type === 'video') && !file) || (type === 'text' && !caption.trim());
  const mediaLabel = type === 'photo' ? 'tap to add a photo' : 'tap to add a video';
  const isDesktop = viewport === 'desktop';
  const isTablet = viewport === 'tablet';
  const tabletLeftLineInset = 150;
  const tabletBodyPadLeft = 166;
  const tabletBodyPadRight = 24;
  const contentLeftInset = isDesktop ? 50 : isTablet ? tabletBodyPadLeft : 48;
  const mediaBoxMinHeight = isDesktop ? 160 : 176;
  const mediaMeta = type === 'photo' ? 'jpg, png · max 10MB' : 'mp4 · max 60s · 50MB';

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: '100%' }}>
      {isTablet ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: tabletLeftLineInset,
            width: 1,
            background: v.border,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      ) : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isTablet ? `10px ${tabletBodyPadRight}px 10px ${tabletBodyPadLeft}px` : '10px 16px',
          borderBottom: isTablet ? 'none' : `1.5px solid ${v.borderStrong}`,
          background: v.base,
          position: 'relative',
        }}
      >
        <span style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 500, color: v.ink2 }}>new post</span>
        <button
          onClick={handlePost}
          disabled={isActionDisabled}
          style={{
            fontFamily: v.fontBody,
            fontSize: 14,
            fontWeight: 600,
            background: isActionDisabled ? v.surfaceRaised : v.accent,
            color: isActionDisabled ? v.ink3 : v.ink,
            border: 'none',
            borderRadius: 999,
            padding: '7px 16px',
            cursor: isActionDisabled ? 'default' : 'pointer',
          }}
        >
          {isUploading ? `uploading ${progress}%` : createPostMutation.isPending ? 'posting...' : 'post it'}
        </button>
        {isTablet ? (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: tabletLeftLineInset,
              right: 0,
              bottom: 0,
              height: 1.5,
              background: v.borderStrong,
            }}
          />
        ) : null}
      </div>

      {formError ? (
        <div
          style={{
            padding: isTablet ? `10px ${tabletBodyPadRight}px 0 ${tabletBodyPadLeft}px` : '10px 16px 0',
            fontFamily: v.fontBody,
            fontSize: 13,
            color: v.error,
          }}
        >
          {formError}
        </div>
      ) : null}

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            gap: 0,
            padding: isTablet ? `12px ${tabletBodyPadRight}px 4px ${tabletBodyPadLeft}px` : '12px 16px 4px',
            borderBottom: isTablet ? 'none' : `1.5px solid ${v.borderStrong}`,
            position: 'relative',
          }}
        >
          {[['text', 'type', 'text'], ['photo', 'image', 'photo'], ['video', 'video', 'video']].map(([tabId, icon, label]) => (
            <button
              key={tabId}
              onClick={() => setType(tabId)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '10px 0 11px',
                borderBottom: type === tabId ? `2.5px solid ${v.ink}` : '2.5px solid transparent',
                marginBottom: -1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontFamily: v.fontBody,
                fontSize: 13,
                fontWeight: type === tabId ? 600 : 500,
                color: type === tabId ? v.ink : v.ink3,
              }}
            >
              <LxIcon name={icon} size={16} color={type === tabId ? v.ink : v.ink3} />
              {label}
            </button>
          ))}
          {isTablet ? (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: tabletLeftLineInset,
                right: 0,
                bottom: 0,
                height: 1.5,
                background: v.borderStrong,
              }}
            />
          ) : null}
        </div>

        <div style={{ display: 'flex', gap: 12, padding: isTablet ? `18px ${tabletBodyPadRight}px 0 ${tabletBodyPadLeft}px` : '18px 16px 0' }}>
          <LxAvatar size={36} idx={0} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 600, color: v.ink, marginBottom: 12 }}>you</div>

            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept={type === 'photo' ? 'image/*' : 'video/*'} onChange={handleFileChange} />

            {type !== 'text' ? (
              <div
                onClick={() => !file && fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  minHeight: mediaBoxMinHeight,
                  background: v.surfaceSunken,
                  borderRadius: 12,
                  border: previewUrl ? 'none' : `1px dashed ${v.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: file ? 'default' : 'pointer',
                  marginBottom: 14,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {previewUrl ? (
                  <>
                    {type === 'photo' ? (
                      <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <video src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                    )}
                    <button onClick={removeFile} style={{ position: 'absolute', top: 8, right: 8, background: v.black50, border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer', zIndex: 10 }}>
                      <LxIcon name="close" size={16} color={v.white} />
                    </button>
                  </>
                ) : (
                  <>
                    <LxIcon name={type === 'photo' ? 'image' : 'video'} size={32} color={v.ink3} />
                    <span style={{ fontFamily: v.fontBody, fontSize: 13, color: v.ink2 }}>{mediaLabel}</span>
                    <span style={{ fontFamily: v.fontMono, fontSize: 10, color: v.ink3 }}>{mediaMeta}</span>
                  </>
                )}
              </div>
            ) : null}

            <textarea
              value={caption}
              onChange={(event) => handleCaptionChange(event.target.value)}
              placeholder={type === 'text' ? 'say something real...' : 'add a caption (optional)'}
              style={{
                width: '100%',
                fontFamily: v.fontBody,
                fontSize: type === 'text' ? 17 : 14,
                color: v.ink,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.55,
                letterSpacing: '-0.01em',
                minHeight: type === 'text' ? 120 : 60,
                padding: 0,
              }}
            />
          </div>
        </div>

        <div
          style={{
            padding: isTablet ? `8px ${tabletBodyPadRight}px 4px ${contentLeftInset}px` : '8px 16px 4px',
            marginLeft: isTablet ? 0 : contentLeftInset,
          }}
        >
          <div style={{ fontFamily: v.fontMono, fontSize: 9, color: v.ink3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <LxIcon name="hash" size={12} color={v.ink3} />
            hashtags {allTags.length > 0 ? <span style={{ color: v.accentText, marginLeft: 4 }}>({allTags.length})</span> : null}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SUGGESTED_TAGS.map((tag) => (
              <LxTag key={tag} active={allTags.includes(tag)} onClick={() => insertTag(tag)}>
                #{tag}
              </LxTag>
            ))}
          </div>
        </div>

        <LxDivider mx={isTablet ? tabletLeftLineInset : 0} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isTablet ? `14px ${tabletBodyPadRight}px 14px ${tabletBodyPadLeft}px` : '14px 16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: v.fontMono, fontSize: 11, color: v.ink3 }}>
            <LxIcon name="hash" size={13} color={v.ink3} />
            <span>auto-tagged: {captionTags.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {caption.length > 0 ? (
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: `conic-gradient(var(--lx-accent) ${(caption.length / MAX_CHARS) * 360}deg, var(--lx-surface-raised) 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ width: 17, height: 17, borderRadius: '50%', background: v.base }} />
              </div>
            ) : null}
            <span style={{ fontFamily: v.fontMono, fontSize: 11, color: caption.length > MAX_CHARS * 0.9 ? v.error : v.ink3 }}>
              {MAX_CHARS - caption.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
