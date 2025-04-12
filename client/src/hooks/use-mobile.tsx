import { useState, useEffect } from 'react';

export function useMobile(mobileWidth = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if the screen is mobile sized
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < mobileWidth);
    };

    // Check initially
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, [mobileWidth]);

  return isMobile;
}

export default useMobile;
