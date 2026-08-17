import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v } from '@/config/tokens';
import { useViewport } from '../hooks/useViewport';
import { LxIcon, LxAvatar } from './primitives';
import { useStoryFeed, useCreateStory, useRecordStoryView } from '../hooks/useStories';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { useMediaConstraints } from '../hooks/useMediaConstraints';
import { useAuthStore } from '@/store/useAuthStore';
import { routeTo, CHAR_LIMITS } from '@/config/constants';
import { buildAcceptAttribute, validateFile, validateDuration } from '../utils/composerMedia';

const STORY_CARD_RADIUS = 18;
const STORY_RATIO = 9 / 16;
const IMAGE_STORY_DURATION_MS = 5000;

// Light frosted chips, matching the post-media carousel controls: legible over
// any image without a dark scrim that competes with the photo underneath.
const CONTROL_BG = 'rgba(255,255,255,0.9)';
const CONTROL_FG = '#1c1a17';
const CONTROL_SHADOW = '0 1px 5px rgba(0,0,0,0.3)';

// ─── Story Stage (shared chrome) ───────────────────────────────────────────
function StoryStage({ children, onClose, footer, viewport, scale = 1 }) {
  const isMobile = viewport === 'mobile';

  if (isMobile) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: v.black, zIndex: 1000,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {children}
          <button onClick={onClose} aria-label="close" style={{
            position: 'absolute', top: 14, right: 12, zIndex: 5,
            background: v.black35, border: 'none', cursor: 'pointer',
            width: 34, height: 34, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LxIcon name="close" size={20} color={v.white} />
          </button>
        </div>
        {footer}
      </div>
    );
  }

  // Scaled up on the owner's request, for a more detailed view, while staying
  // short of full screen so the overlay still reads as a card over the feed.
  const cardHeight = `min(${90 * scale}vh, ${860 * scale}px)`;
  const cardWidth  = `calc(${cardHeight} * ${STORY_RATIO})`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: v.black78,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <button onClick={onClose} aria-label="close" style={{
        position: 'absolute', top: 20, right: 20,
        background: v.white12, border: 'none', cursor: 'pointer',
        width: 38, height: 38, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <LxIcon name="close" size={20} color={v.white} />
      </button>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        height: cardHeight,
      }}>
        <div style={{
          width: cardWidth, height: '100%',
          borderRadius: STORY_CARD_RADIUS, overflow: 'hidden', position: 'relative',
          boxShadow: `0 32px 80px ${v.black55}, 0 0 0 1px ${v.white04}`,
        }}>
          {children}
        </div>
        {footer && (
          <div style={{ width: cardWidth }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function NavButton({ side, onClick, viewport }) {
  if (!onClick) return null;
  const isMobile = viewport === 'mobile';
  return (
    <button
      onClick={(event) => { event.stopPropagation(); onClick(); }}
      aria-label={side === 'left' ? 'previous story' : 'next story'}
      style={{
        position: 'absolute', top: '50%', [side]: isMobile ? 10 : -18,
        transform: 'translateY(-50%)',
        width: 34, height: 34, borderRadius: 999, border: 'none',
        background: CONTROL_BG, boxShadow: CONTROL_SHADOW,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, zIndex: 6,
      }}
    >
      <LxIcon name={side === 'left' ? 'chevronLeft' : 'chevronRight'} size={18} color={CONTROL_FG} />
    </button>
  );
}

/**
 * Flattens the story tray into one linear sequence in tray order (own entry
 * first, then each followed author in turn), so next/prev can step through
 * every story of one person and continue straight into the next person's
 * without the caller needing to reopen the viewer.
 */
function useFlatStorySequence() {
  const { tray } = useStoryFeed();
  return useMemo(
    () => tray.flatMap((entry) => entry.stories.map((story) => ({ story, entry }))),
    [tray],
  );
}

// ─── Story View Screen ──────────────────────────────────────────────────────
export function StoryViewScreen({ viewport: vpProp }) {
  const navigate = useNavigate();
  const { storyId } = useParams();
  const vp = vpProp || useViewport();
  const currentUser = useAuthStore((state) => state.user);
  const sequence = useFlatStorySequence();
  const recordView = useRecordStoryView();
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const recordedRef = useRef(null);

  const currentIndex = sequence.findIndex((item) => item.story.id === storyId);
  const current = currentIndex >= 0 ? sequence[currentIndex] : null;
  const story = current?.story;
  const entry = current?.entry;
  const isVideo = story?.media?.mediaType?.toUpperCase() === 'VIDEO';
  const segmentIndex = entry ? entry.stories.findIndex((s) => s.id === storyId) : 0;
  const segmentCount = entry?.stories.length || 1;

  const close = () => navigate(-1);

  const goTo = (index) => {
    if (index < 0) {
      setProgress(0);
      return;
    }
    if (index >= sequence.length) {
      close();
      return;
    }
    navigate(routeTo.storyView(sequence[index].story.id), { replace: true });
  };

  const next = () => goTo(currentIndex + 1);
  const prev = () => goTo(currentIndex - 1);

  // A story the tray no longer carries (expired, or a stale link) cannot be
  // shown; closing rather than rendering a blank card keeps the viewer from
  // getting stuck on nothing.
  useEffect(() => {
    if (sequence.length > 0 && currentIndex === -1) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence.length, currentIndex]);

  // Records the view once per story shown. The owner's own stories never
  // create a view row server-side, so the call is skipped for them entirely.
  useEffect(() => {
    if (!story || !entry) return;
    if (entry.userId === currentUser?.id) return;
    if (recordedRef.current === story.id) return;
    recordedRef.current = story.id;
    recordView.mutate(story.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  // Progress resets on every story change and, for images, advances on a
  // fixed timer. Video stories are driven by the element's own playback via
  // onTimeUpdate/onEnded instead, so the bar tracks real duration exactly.
  useEffect(() => {
    setProgress(0);
    if (isVideo) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / IMAGE_STORY_DURATION_MS) * 100, 100);
      setProgress(pct);
      if (pct >= 100) clearInterval(timer);
    }, 80);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, isVideo]);

  useEffect(() => {
    if (!isVideo || progress < 100) return;
    next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, isVideo]);

  if (!story || !entry) {
    return <StoryStage viewport={vp} onClose={close}><div /></StoryStage>;
  }

  const authorName = entry.userDisplayName || entry.username;

  const card = (
    <div style={{
      position: 'absolute', inset: 0,
      background: v.storySurface,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {isVideo ? (
        <video
          ref={videoRef}
          src={story.media.cdnUrl}
          autoPlay
          playsInline
          muted={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onTimeUpdate={(event) => {
            const el = event.currentTarget;
            if (el.duration) setProgress((el.currentTime / el.duration) * 100);
          }}
          onEnded={next}
        />
      ) : (
        <img src={story.media.cdnUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      )}

      {/* Progress bar: one segment per story this author currently has active. */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', gap: 4 }}>
        {Array.from({ length: segmentCount }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 2, background: v.white30, borderRadius: 1, overflow: 'hidden' }}>
            <div style={{
              width: `${i < segmentIndex ? 100 : i === segmentIndex ? progress : 0}%`,
              height: '100%', background: v.white,
              transition: i === segmentIndex ? 'width 80ms linear' : 'none',
            }} />
          </div>
        ))}
      </div>

      {/* Author header */}
      <div style={{
        position: 'absolute', top: 24, left: 14, right: 14,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <LxAvatar size={30} src={entry.userAvatarUrl} />
        <span style={{ fontFamily: v.fontBody, fontSize: 13, fontWeight: 600, color: v.white, textShadow: `0 1px 6px ${v.black40}` }}>{authorName}</span>
      </div>

      {/* Caption */}
      {story.caption && (
        <div style={{
          position: 'absolute', bottom: 24, left: 16, right: 16,
          fontFamily: v.fontBody, fontSize: 15, fontWeight: 500,
          color: v.white, textShadow: `0 1px 8px ${v.black55}`,
        }}>{story.caption}</div>
      )}

      {/* Tap zones, kept alongside the explicit nav buttons below as a larger
          touch target that needs no precise aim. */}
      <button onClick={prev} style={{
        position: 'absolute', left: 0, top: 60, bottom: 80, width: '30%',
        background: 'transparent', border: 'none', cursor: 'pointer',
      }} aria-label="previous" />
      <button onClick={next} style={{
        position: 'absolute', right: 0, top: 60, bottom: 80, width: '30%',
        background: 'transparent', border: 'none', cursor: 'pointer',
      }} aria-label="next" />

      <NavButton side="left" viewport={vp} onClick={currentIndex > 0 ? prev : null} />
      <NavButton side="right" viewport={vp} onClick={next} />
    </div>
  );

  return (
    <StoryStage viewport={vp} onClose={close} scale={1.1}>
      {card}
    </StoryStage>
  );
}

// ─── Story Composer Screen ──────────────────────────────────────────────────
export function StoryComposerScreen({ viewport: vpProp }) {
  const navigate = useNavigate();
  const vp = vpProp || useViewport();
  const fileInputRef = useRef(null);
  const [item, setItem] = useState(null);
  const [caption, setCaption] = useState('');
  const [formError, setFormError] = useState('');

  const { uploadMedia, getMediaMetadata, isUploading } = useMediaUpload();
  const { constraints } = useMediaConstraints();
  const createStory = useCreateStory();

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    setFormError('');

    const check = validateFile(file, constraints);
    if (!check.ok) {
      setFormError(check.message);
      return;
    }
    const metadata = await getMediaMetadata(file).catch(() => null);
    const durationCheck = validateDuration(file, metadata?.duration, constraints);
    if (!durationCheck.ok) {
      setFormError(durationCheck.message);
      return;
    }

    if (item) URL.revokeObjectURL(item.previewUrl);
    setItem({
      file,
      previewUrl: URL.createObjectURL(file),
      isVideo: file.type.startsWith('video/'),
    });
  };

  const canShare = Boolean(item) && !isUploading && !createStory.isPending;

  const handleShare = async () => {
    if (!item) return;
    setFormError('');
    try {
      const asset = await uploadMedia(item.file);
      createStory.mutate(
        { mediaId: asset.id, caption: caption.trim() || null },
        {
          onSuccess: () => {
            URL.revokeObjectURL(item.previewUrl);
            navigate(-1);
          },
          onError: (error) => {
            setFormError(error.message || "we couldn't share that story. try again.");
          },
        },
      );
    } catch (error) {
      setFormError(error?.uploadMessage || "we couldn't upload that file. try again.");
    }
  };

  const card = (
    <div style={{
      position: 'absolute', inset: 0,
      background: v.storySurface,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {item ? (
        <>
          {item.isVideo ? (
            <video src={item.previewUrl} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <img src={item.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="choose a different file"
            style={{
              position: 'absolute', top: 14, left: 14,
              background: v.black35, border: 'none', cursor: 'pointer',
              width: 34, height: 34, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <LxIcon name="image" size={16} color={v.white} />
          </button>
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value.slice(0, CHAR_LIMITS.caption))}
            placeholder="add a caption..."
            style={{
              position: 'absolute', bottom: 20, left: 16, right: 16,
              fontFamily: v.fontBody, fontSize: 15, fontWeight: 500,
              color: v.white, textShadow: `0 1px 8px ${v.black55}`,
              background: 'transparent', border: 'none', outline: 'none',
            }}
          />
        </>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: v.white65, fontFamily: v.fontBody, fontSize: 14, textAlign: 'center' }}
        >
          <LxIcon name="image" size={48} color={v.white45} />
          <div style={{ marginTop: 12 }}>tap to add a photo or video</div>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={buildAcceptAttribute(constraints)}
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />
    </div>
  );

  const controls = (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10,
      padding: vp === 'mobile' ? '14px 16px 20px' : '4px 0',
      background: vp === 'mobile' ? v.black : 'transparent',
    }}>
      {formError ? (
        <div role="alert" style={{ fontFamily: v.fontBody, fontSize: 12, color: v.error, textAlign: 'center' }}>{formError}</div>
      ) : null}
      <button
        onClick={handleShare}
        disabled={!canShare}
        style={{
          width: '100%', fontFamily: v.fontBody, fontSize: 14, fontWeight: 600,
          background: canShare ? v.accent : v.white12,
          color: canShare ? v.ink : v.white40,
          border: 'none', borderRadius: 999, padding: '12px 20px',
          cursor: canShare ? 'pointer' : 'default',
        }}>
        {isUploading ? 'uploading...' : createStory.isPending ? 'sharing...' : 'share to story'}
      </button>
    </div>
  );

  return (
    <StoryStage viewport={vp} onClose={() => navigate(-1)} footer={controls}>
      {card}
    </StoryStage>
  );
}
