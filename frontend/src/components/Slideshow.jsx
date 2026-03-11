import React, { useEffect, useRef } from 'react';
import { Maximize2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Slideshow({ presentation, currentSlide, onEnd, onNext, onPrev }) {
    const isGoogleSlide = presentation.type === 'slide';

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
    // Kapopo usually uses Google slides simply by asking players to click the slide or use a proxy.
    // Since we rely on a controller, we can simulate focus or just tell players they must click on the host PC?
    // Actually, if we use the embed link `?start=false&loop=false&delayms=3000#slide=id.pX`, we can just change the key/src 
    // to force standard navigation, or we just rely on `presentationState` to show the current slide.

    // Realistically for PDF: We can use native PDF viewer with `#page=${currentSlide + 1}`.

    return (
        <motion.div
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
                        src={`${presentation.url}#slide=${currentSlide + 1}`}
                        className="presentation-frame"
                        allowFullScreen
                        title={presentation.title}
                    />
                ) : (
                    <object
                        data={`${presentation.url}#page=${currentSlide + 1}&view=Fit`}
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
        </motion.div>
    );
}
