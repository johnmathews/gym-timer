import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
  },
  onwarn(warning, handler) {
    if (warning.code === "a11y_click_events_have_key_events") return;
    handler(warning);
  },
};

export default config;
