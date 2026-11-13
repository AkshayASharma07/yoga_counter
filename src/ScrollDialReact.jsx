import React, { useEffect, useRef } from 'react';
import { ScrollDial } from '../js/scroll-dial.js';

/**
 * React Wrapper for the 3D Rotating Scroll Dial Component
 *
 * Example usage:
 * <ScrollDialPicker
 *   columns={3} // or [{ min: 0, max: 9, label: 'Hundreds' }, ...]
 *   value={[1, 0, 8]}
 *   onChange={(values, formatted) => console.log(values, formatted)}
 * />
 */
export function ScrollDialPicker({
  columns = 1,
  value = null,
  separator = '',
  showSteppers = false,
  haptic = true,
  className = '',
  onChange
}) {
  const containerRef = useRef(null);
  const dialRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    dialRef.current = new ScrollDial(containerRef.current, {
      columns,
      value,
      separator,
      showSteppers,
      haptic,
      className,
      onChange
    });

    return () => {
      if (dialRef.current) {
        dialRef.current.destroy();
        dialRef.current = null;
      }
    };
  }, [columns, separator, showSteppers, haptic, className]);

  // Keep values synchronized if value prop updates from parent
  useEffect(() => {
    if (dialRef.current && value !== null && value !== undefined) {
      dialRef.current.setValues(value, false);
    }
  }, [value]);

  return <div ref={containerRef} className="zen-scroll-dial-wrapper" />;
}

export default ScrollDialPicker;
