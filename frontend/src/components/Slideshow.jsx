import React, { useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;

export default function Slideshow({ presentation, currentSlide, onEnd, onNext, onPrev }) {
    const isGoogleSlide = presentation.type === 'slide';
    const googleSlidesUrl = `${presentation.url}#slide=id.p${currentSlide + 1}`;
    const pdfUrl = `${presentation.url}#page=${currentSlide + 1}&view=Fit`;

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                if (onNext) onNext();
            } else if (e.key === 'ArrowLeft') {
                if (onPrev) onPrev();
            } else if (e.key === 'Escape') {
                onEnd();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onNext, onPrev, onEnd]);

    // To handle next/prev for Google slides, we often can't inject JS into the iframe due to CORS.
    // BUT the controller can still just track "Slide #X",
    // actually Google Slides embed uses hash nav: `#slide=id.p${slideNumber}`.
    // Or simply, we just pass the slide index to the user. For Google slides,
    // we might have to rely on the presenter to manually tap if they use the native controls wrapper.
    // A simple hack: Google Slides iframe does not natively respond to external postMessage for slide changes.
    // Present or Panic usually handles Google Slides by letting players click the slide or use a proxy.
    // Since we rely on a controller, we can simulate focus or just tell players they must click on the host PC?
    // Actually, if we use the embed link `?start=false&loop=false&delayms=3000#slide=id.pX`, we can just change the key/src 
    // to force standard navigation, or we just rely on `presentationState` to show the current slide.

    // Realistically for PDF: We can use native PDF viewer with `#page=${currentSlide + 1}`.

    return (
        <MotionDiv
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="slideshow-container"
        >
            <div className="slideshow-header">
                <h2 className="title">{presentation.title}</h2>
                <button onClick={onEnd} className="end-btn group">
                    <XCircle size={28} className="group-hover:text-red-400 transition-colors" />
                    <span>End Presentation</span>
                </button>
            </div>

            <div className="slideshow-content">
                {isGoogleSlide ? (
                    <iframe
                        key={`${presentation.id}-${currentSlide}`}
                        src={googleSlidesUrl}
                        className="presentation-frame"
                        allowFullScreen
                        title={presentation.title}
                    />
                ) : (
                    <object
                        key={`${presentation.id}-${currentSlide}`}
                        data={pdfUrl}
                        type="application/pdf"
                        className="presentation-frame"
                    >
                        <p>Your browser doesn't support PDF viewing. <a href={presentation.url}>Download the PDF</a>.</p>
                    </object>
                )}
            </div>

            {/* For controllers, we just overlay a small non-intrusive HUD */}
            <div className="slideshow-hud">
                <p>Slide {currentSlide + 1}</p>
                <p className="hud-hint">Controllers can swipe or press Next/Prev on their phones.</p>
                <p className="hud-hint">Note: for Google Slides, you might need to click the screen once to focus before keyboard/controller works natively, or use the built-in slide buttons.</p>
            </div>
        </MotionDiv>
    );
}
