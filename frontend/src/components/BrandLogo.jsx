import React from 'react';

export default function BrandLogo({
    variant = 'full',
    className = '',
    imageClassName = '',
    titleClassName = '',
    subtitleClassName = '',
    title = 'Present or Panic',
    subtitle = 'Multiplayer PowerPoint Karaoke',
    showText = true
}) {
    const isIcon = variant === 'icon';
    const imageSrc = isIcon ? '/brand/present-or-panic-icon.svg' : '/brand/present-or-panic-logo.svg';
    const imageAlt = isIcon ? 'Present or Panic icon' : 'Present or Panic logo';

    return (
        <div className={`brand-logo ${className}`.trim()}>
            <img src={imageSrc} alt={imageAlt} className={imageClassName} />
            {showText ? (
                <div className="brand-copy">
                    <div className={titleClassName}>{title}</div>
                    <div className={subtitleClassName}>{subtitle}</div>
                </div>
            ) : null}
        </div>
    );
}
