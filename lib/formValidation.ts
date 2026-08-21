import type { FormEvent, InvalidEvent } from "react";

/** Force English HTML5 validation messages (browser default follows OS/browser language). */
export function englishRequiredEmailProps() {
  return {
    required: true as const,
    onInvalid: (e: InvalidEvent<HTMLInputElement>) => {
      e.currentTarget.setCustomValidity("Please enter a valid email address.");
    },
    onInput: (e: FormEvent<HTMLInputElement>) => {
      e.currentTarget.setCustomValidity("");
    }
  };
}
