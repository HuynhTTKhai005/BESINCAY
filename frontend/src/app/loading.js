"use client";

import { useEffect, useState } from "react";

export default function Preloader() {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const handleLoad = () => setLoaded(true);

        const timeout = setTimeout(() => setLoaded(true), 1000);

        window.addEventListener("load", handleLoad);

        return () => {
            window.removeEventListener("load", handleLoad);
            clearTimeout(timeout);
        };
    }, []);

    return !loaded ? <div id="preloader"></div> : null;
}
