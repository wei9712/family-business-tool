# 家業系統小工具

這是一個以 React.js 建立的靜態網站專案，適合部署到 GitHub Pages。資料來源先以 JSON 檔管理，前端會讀取資料並做收益、成本與結餘等計算。

目前專案採用 Vite + React.js 架構，適合後續加入更多元件、計算模組與 JSON 資料來源。

## 專案結構

```text
public/
  data/
    catalog.json           資料集索引
    dishes.json            菜品資料
    ceramics.json          瓷器資料
    wine-recipes.json      酒水製作方法
    crop-times.json        作物生長時間
    business-sample.json   舊版範例資料
src/
  main.jsx                 React 入口
  App.jsx                  主畫面與資料流程
  components/              React 畫面元件
  data/                    JSON 載入與驗證
  utils/                   計算與格式化函式
  styles.css               介面樣式
```

## 開發指令

```bash
pnpm install
pnpm dev
pnpm build
```

`vite.config.js` 已設定 `base: './'`，打包後的 `dist/` 可以直接用在 GitHub Pages。

## GitHub Pages

1. 在 GitHub 建立一個 repository。
2. 把此專案 push 上去。
3. 到 repository 的 `Settings > Pages`。
4. 若使用 GitHub Actions，選擇 Actions 部署；此專案已附 `.github/workflows/deploy.yml`。

資料已拆放在 `public/data/*.json`。之後可從 `public/data/catalog.json` 讀取資料集清單，再依需求載入菜品、瓷器、酒水製作方法或作物時間。
