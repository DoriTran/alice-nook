import type { CSSProperties, FC, SyntheticEvent } from 'react';

import clsx from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import type { ImageAttachment } from '@/store/diary/type';

import { useAttachmentUrl } from '@/api';
import { AdIcon } from '@/packages/base';

import styles from './ImageLightbox.module.css';

export type ImageLightboxProps = {
  images: ImageAttachment[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

const downloadImage = async (url: string, name?: string): Promise<void> => {
  const filename = name?.trim() || 'image';

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    // Fallback: open the image in a new tab if the blob download fails
    // (e.g. a cross-origin host without CORS).
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

const aspectRatioFrom = (image: ImageAttachment): number | undefined => {
  if (image.width && image.height && image.height > 0) {
    return image.width / image.height;
  }

  return undefined;
};

const Thumbnail: FC<{
  image: ImageAttachment;
  active: boolean;
  index: number;
  onSelect: (index: number) => void;
}> = ({ image, active, index, onSelect }) => {
  const url = useAttachmentUrl(image);
  return (
    <button
      type="button"
      className={clsx(styles.thumb, active && styles.thumbActive)}
      onClick={() => onSelect(index)}
      aria-label={`View image ${index + 1}`}
      aria-current={active}
    >
      {url ? (
        <img
          src={url}
          alt={image.name ?? `Image ${index + 1}`}
          className={styles.thumbImage}
        />
      ) : null}
    </button>
  );
};

const ImageLightbox: FC<ImageLightboxProps> = ({
  images,
  index,
  onIndexChange,
  onClose,
}) => {
  const total = images.length;
  const current = images[index];
  const currentUrl = useAttachmentUrl(current);

  const [aspectRatio, setAspectRatio] = useState<number | undefined>(() =>
    current ? aspectRatioFrom(current) : undefined,
  );

  useEffect(() => {
    setAspectRatio(current ? aspectRatioFrom(current) : undefined);
  }, [current]);

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;

    if (naturalWidth > 0 && naturalHeight > 0) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

  const hasPrev = index > 0;
  const hasNext = index < total - 1;

  const goPrev = useCallback(() => {
    if (index > 0) {
      onIndexChange(index - 1);
    }
  }, [index, onIndexChange]);

  const goNext = useCallback(() => {
    if (index < total - 1) {
      onIndexChange(index + 1);
    }
  }, [index, total, onIndexChange]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goPrev();
          break;
        case 'ArrowRight':
          goNext();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [goPrev, goNext, onClose]);

  if (!current) {
    return null;
  }

  const frameStyle = {
    '--ar': aspectRatio ?? 1.5,
  } as CSSProperties;

  return createPortal(
    <div className={styles.overlay}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close image viewer"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        className={styles.content}
        role="dialog"
        aria-modal="true"
        aria-label={current.name ?? 'Image viewer'}
      >
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => void downloadImage(currentUrl, current.name)}
            aria-label="Download image"
          >
            <AdIcon icon="Download" source="lucide" size="1.125rem" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            aria-label="Close"
          >
            <AdIcon icon="X" source="lucide" size="1.125rem" />
          </button>
        </div>

        <div className={styles.stage}>
          {hasPrev && (
            <button
              type="button"
              className={clsx(
                styles.iconButton,
                styles.arrow,
                styles.arrowPrev,
              )}
              onClick={goPrev}
              aria-label="Previous image"
            >
              <AdIcon icon="ChevronLeft" source="lucide" size="1.5rem" />
            </button>
          )}

          <figure className={styles.figure}>
            <div className={styles.frame} style={frameStyle}>
              <img
                src={currentUrl}
                alt={current.name ?? 'Image attachment'}
                className={styles.image}
                onLoad={handleImageLoad}
              />
            </div>
          </figure>

          {hasNext && (
            <button
              type="button"
              className={clsx(
                styles.iconButton,
                styles.arrow,
                styles.arrowNext,
              )}
              onClick={goNext}
              aria-label="Next image"
            >
              <AdIcon icon="ChevronRight" source="lucide" size="1.5rem" />
            </button>
          )}
        </div>

        {total > 1 && (
          <>
            <div className={styles.thumbnails}>
              {images.map((image, thumbIndex) => (
                <Thumbnail
                  key={image.id}
                  image={image}
                  active={thumbIndex === index}
                  index={thumbIndex}
                  onSelect={onIndexChange}
                />
              ))}
            </div>
            <span className={styles.counter}>
              {index + 1} / {total}
            </span>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default ImageLightbox;
