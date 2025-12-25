const MOBILE_REGEX = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export function isMobileUserAgent(userAgent: string | null): boolean {
    if (!userAgent) return false;
    return MOBILE_REGEX.test(userAgent);
}
