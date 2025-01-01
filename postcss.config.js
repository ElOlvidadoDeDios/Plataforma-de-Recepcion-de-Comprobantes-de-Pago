// postcss.config.js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      overrideBrowserslist: ['last 2 versions', 'not ie < 9', '> 1%'],
      cascade: false,
    },
  },
};
