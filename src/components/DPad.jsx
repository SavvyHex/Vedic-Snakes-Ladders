import React from 'react';
import './DPad.css';

export default function DPad({ onDirectionPress, onDirectionRelease, disabled }) {
  const handleTouchStart = (direction) => (e) => {
    e.preventDefault();
    if (!disabled) {
      onDirectionPress(direction);
    }
  };

  const handleTouchEnd = (direction) => (e) => {
    e.preventDefault();
    if (!disabled) {
      onDirectionRelease(direction);
    }
  };

  const handleMouseDown = (direction) => (e) => {
    e.preventDefault();
    if (!disabled) {
      onDirectionPress(direction);
    }
  };

  const handleMouseUp = (direction) => (e) => {
    e.preventDefault();
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
