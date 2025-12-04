"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

export function FacebookPixel() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!PIXEL_ID) {
            console.warn("Facebook Pixel ID is not configured");
            return;
        }

        import("react-facebook-pixel")
            .then((module) => module.default)
            .then((ReactPixel) => {
                ReactPixel.init(PIXEL_ID, undefined, {
                    autoConfig: true,
                    debug: process.env.NODE_ENV === "development",
                });
                ReactPixel.pageView();
            });
    }, [pathname, searchParams]);

    return null;
}
