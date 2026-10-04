import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    favicon: "./src/public/jade.svg",
    title: "Jade"
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|zustand)[\\/]/,
          name: 'react-vendor',
          priority: 20,
        },
        motion: {
          test: /[\\/]node_modules[\\/]motion[\\/]/,
          name: 'motion-vendor',
          priority: 20,
        },
      },
    },
  },
  output: {
    target: 'web',
    minify: true,
    sourceMap: false,
  },
});
