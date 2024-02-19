/** @type {import("next").NextConfig} */
const config = {
  /**
   * Enable react strict mode
   *
   * This is a feature that helps with catching common mistakes in your application.
   */
  reactStrictMode: true,

  /**
   * If you are using `appDir` then you must comment the below `i18n` config out.
   *
   * @see https://github.com/vercel/next.js/issues/41980
   */
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
};

/**
 * Export the config default
 */
export default config;
