import React, { useEffect } from 'react';
import './DPad.css';

export default function DPad({ onDirectionPress, onDirectionRelease, disabled }) {
  // Reset all controls when disabled (e.g., when quiz appears)
  useEffect(() => {
    if (disabled) {
      // Release all directions
      onDirectionRelease('up');
      onDirectionRelease('down');
      onDirectionRelease('left');
      onDirectionRelease('right');
    }
  }, [disabled, onDirectionRelease]);

  const handleTouchStart = (direction) => (e) => {
    if (!disabled) {
      onDirectionPress(direction);
    }
  };

  const handleTouchEnd = (direction) => (e) => {
    if (!disabled) {
      onDirectionRelease(direction);
    }
  };

  const handleMouseDown = (direction) => (e) => {
    if (!disabled) {
      onDirectionPress(direction);
    }
  };

  const handleMouseUp = (direction) => (e) => {
    if (!disabled) {
      onDirectionRelease(direction);
    }
  };

  return (
    <div className={`dpad-container ${disabled ? 'disabled' : ''}`}>
      <div className="dpad">
        {/* Up button */}
        <button
          className="dpad-btn dpad-up"
          onTouchStart={handleTouchStart('up')}
          onTouchEnd={handleTouchEnd('up')}
          onMouseDown={handleMouseDown('up')}
          onMouseUp={handleMouseUp('up')}
          onMouseLeave={handleMouseUp('up')}
          disabled={disabled}
        >
          <span>▲</span>
        </button>

        {/* Left button */}
        <button
          className="dpad-btn dpad-left"
          onTouchStart={handleTouchStart('left')}
          onTouchEnd={handleTouchEnd('left')}
          onMouseDown={handleMouseDown('left')}
          onMouseUp={handleMouseUp('left')}
          onMouseLeave={handleMouseUp('left')}
          disabled={disabled}
        >
          <span>◀</span>
        </button>

        {/* Center (inactive) */}
        <div className="dpad-center"></div>

        {/* Right button */}
        <button
          className="dpad-btn dpad-right"
          onTouchStart={handleTouchStart('right')}
          onTouchEnd={handleTouchEnd('right')}
          onMouseDown={handleMouseDown('right')}
          onMouseUp={handleMouseUp('right')}
          onMouseLeave={handleMouseUp('right')}
          disabled={disabled}
        >
          <span>▶</span>
        </button>

        {/* Down button */}
        <button
          className="dpad-btn dpad-down"
          onTouchStart={handleTouchStart('down')}
          onTouchEnd={handleTouchEnd('down')}
          onMouseDown={handleMouseDown('down')}
          onMouseUp={handleMouseUp('down')}
          onMouseLeave={handleMouseUp('down')}
          disabled={disabled}
        >
          <span>▼</span>
        </button>
      </div>
    </div>
  );
}
