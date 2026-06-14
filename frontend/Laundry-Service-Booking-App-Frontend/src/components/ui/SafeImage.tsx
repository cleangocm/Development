'use client';

import { useState, useEffect } from 'react';
import NextImage, { ImageProps } from 'next/image';

const DEFAULT_PLACEHOLDER = '/Images/placeholder.svg';
const AVATAR_PLACEHOLDER = '/Images/placeholder-avatar.svg';

export type SafeImageVariant = 'default' | 'avatar';

type SafeImageProps = Omit<ImageProps, 'onError'> & {
  /**
   * Fallback image to show when the primary src fails to load.
   * Defaults to a generic placeholder. Pass variant="avatar" for a person silhouette.
   */
  fallbackSrc?: string;
  /**
   * Convenience shorthand. "avatar" uses the avatar placeholder,
   * "default" uses the generic image placeholder.
   * Ignored when fallbackSrc is explicitly provided.
   */
  variant?: SafeImageVariant;
};

/**
 * Drop-in replacement for next/image that automatically shows a placeholder
 * when the image fails to load (404, network error, broken URL, etc.).
 *
 * Usage:
 *   <SafeImage src={user.profileImage} variant="avatar" alt="Profile" width={40} height={40} />
 *   <SafeImage src={service.image} alt="Service" fill />
 */
const SafeImage = ({
  src,
  fallbackSrc,
  variant = 'default',
  alt,
  ...props
}: SafeImageProps) => {
  const resolvedFallback =
    fallbackSrc ??
    (variant === 'avatar' ? AVATAR_PLACEHOLDER : DEFAULT_PLACEHOLDER);

  const [imgSrc, setImgSrc] = useState<ImageProps['src']>(src || resolvedFallback);
  const [hasError, setHasError] = useState(false);

  // Reset when the src prop changes (e.g. user updates their photo)
  useEffect(() => {
    if (src) {
      setImgSrc(src);
      setHasError(false);
    }
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(resolvedFallback);
    }
  };

  return (
    <NextImage
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
      unoptimized={
        // Skip optimization for external URLs and local SVG fallbacks
        (props as { unoptimized?: boolean }).unoptimized ??
        (typeof imgSrc === 'string' && 
         (imgSrc.startsWith('http') || imgSrc.startsWith('/Images/placeholder')))
      }
    />
  );
};

export default SafeImage;
