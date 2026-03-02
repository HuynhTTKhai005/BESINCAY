'use client';

import { useEffect } from 'react';

export default function AOSInitializer() {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            import('aos').then((AOS) => {
                AOS.init({
                    duration: 1000,
                    easing: 'ease-in-out',
                    once: true,
                    mirror: false
                });
            });
        }
    }, []);

    return null;
}
