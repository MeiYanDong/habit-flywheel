import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig({
  // 开发服务器设置
  server: {
    host: "::",
    port: 8080,
  },

  // 插件配置
  plugins: [
    react(),
    process.env.NODE_ENV === "development" && componentTagger(),
  ].filter(Boolean),

  // 关键配置：强制使用相对路径 - 明确使用 "./"
  base: "./",

  // 构建选项
  build: {
    // 关键配置：清空 assetsDir，所有 JS/CSS 直接放到 dist 根目录
    assetsDir: "",
    // 不生成 source maps，减小体积
    sourcemap: false,
    // 添加rollupOptions确保输出文件位置正确
    rollupOptions: {
      output: {
        // 确保资源文件直接放在根目录
        assetFileNames: "[name]-[hash][extname]",
        chunkFileNames: "[name]-[hash].js",
        entryFileNames: "[name]-[hash].js",
      },
    },
  },

  // 路径别名
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
