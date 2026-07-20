import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

if (!Element.prototype.animate) {
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value: (_keyframes: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions) => {
      const duration = typeof options === "number" ? options : Number(options?.duration ?? 0);
      const animation = {
        currentTime: 0,
        effect: {},
        onfinish: null as Animation["onfinish"],
        playState: "running" as AnimationPlayState,
        cancel() {
          animation.playState = "idle";
        },
      };

      queueMicrotask(() => {
        if (animation.playState !== "running") return;
        animation.currentTime = duration;
        animation.playState = "finished";
        animation.onfinish?.call(
          animation as unknown as Animation,
          new Event("finish") as AnimationPlaybackEvent,
        );
      });

      return animation as unknown as Animation;
    },
  });
}
