import { useState, useEffect } from "react";

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  os: "ios" | "android" | "windows" | "mac" | "linux" | "other";
}

export function useDeviceDetect(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === "undefined") {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isTouch: false,
        os: "other",
      };
    }

    return checkDevice();
  });

  function checkDevice(): DeviceInfo {
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
    const isTouch =
      typeof window !== "undefined" &&
      ("ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia("(pointer: coarse)").matches);

    // OS detection
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(userAgent);
    const isWindows = /Win/.test(userAgent);
    const isMac = /Mac/.test(userAgent) && !isIOS;
    const isLinux = /Linux/.test(userAgent) && !isAndroid;

    let os: DeviceInfo["os"] = "other";
    if (isIOS) os = "ios";
    else if (isAndroid) os = "android";
    else if (isWindows) os = "windows";
    else if (isMac) os = "mac";
    else if (isLinux) os = "linux";

    // Viewport width check
    const width = typeof window !== "undefined" ? window.innerWidth : 1200;

    // Mobile: narrow width OR explicit mobile UA with touch
    const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTabletUA = /iPad|tablet|PlayBook|Silk/i.test(userAgent) || (isIOS && width >= 768);

    const isMobile = (width < 768 && isTouch) || (width < 640) || (isMobileUA && width < 900);
    const isTablet = !isMobile && (isTabletUA || (width >= 768 && width < 1024 && isTouch));
    const isDesktop = !isMobile && !isTablet;

    return {
      isMobile,
      isTablet,
      isDesktop,
      isTouch,
      os,
    };
  }

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(checkDevice());
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return deviceInfo;
}
