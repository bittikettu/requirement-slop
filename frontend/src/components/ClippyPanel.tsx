import { useEffect, useRef } from 'react';

interface ClippyPanelProps {
    thinkingContent: string;
    isVisible: boolean;
    isComplete: boolean;
}

export default function ClippyPanel({ thinkingContent, isVisible, isComplete }: ClippyPanelProps) {
    const bubbleRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of bubble
    useEffect(() => {
        if (bubbleRef.current && !isComplete) {
            bubbleRef.current.scrollTop = bubbleRef.current.scrollHeight;
        }
    }, [thinkingContent, isComplete]);

    if (!isVisible) return null;

    return (
        <div className="clippy-container">
            <div className="clippy-character">
                {/* CSS/SVG representation of Clippy */}
                <div className="clippy-body">
                    <div className="clippy-eyes">
                        <div className="eye left"></div>
                        <div className="eye right"></div>
                    </div>
                     <div className="clippy-眉毛">
                        <div className="brow left"></div>
                        <div className="brow right"></div>
                    </div>
                </div>
                 <div className="clippy-paper"></div>
            </div>
            
            <div className="speech-bubble-wrapper">
                <div className="speech-bubble" ref={bubbleRef}>
                    <div className="speech-content">
                        <strong>Thinking Process:</strong>
                        <div className="thinking-text" style={{whiteSpace: 'pre-wrap'}}>
                            {thinkingContent}
                             {!isComplete && <span className="cursor-blink">|</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
