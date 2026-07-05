# 家業任務規劃

家業任務規劃是一個以 React 與 Vite 建立的靜態網站工具，用來協助玩家規劃家業任務、每週販售品項、素材需求、採集配置與種植時間。

本工具為非官方遊戲輔助工具，僅供個人規劃與試算使用。

## 功能

- 每日任務輸入：選擇菜品或酒水，計算所需材料。
- 每週販售規劃：自訂本週推薦販售的酒水與菜品。
- 額外素材補充：依分類選擇作物、瓷器或一般素材。
- 營運建議：估算是否能同時維持販售並完成任務。
- 採集配置：依漁獲、獵獲、石料、林業分類估算採集工時。
- 素材分析：顯示原始素材、直接需求素材與非種植素材。
- 種植分析：依農田數量、肥料、澆水與作物時間估算種子數、批次與等待時間。
- GitHub Pages 部署：可直接透過 GitHub Actions 部署為靜態網站。

## 專案結構

```text
public/
  data/
    catalog.json
    dishes.json
    ceramics.json
    wine-recipes.json
    crop-times.json
src/
  components/
  data/
  utils/
  App.jsx
  main.jsx
  styles.css
```

## 資料來源

目前資料放在 `public/data/`：

- `dishes.json`：菜品資料
- `ceramics.json`：瓷器資料
- `wine-recipes.json`：酒水製作資料
- `crop-times.json`：作物時間與產量資料
- `catalog.json`：資料目錄

資料皆以 JSON 管理，更新資料後重新整理頁面即可載入最新內容。

## 開發

```bash
pnpm install
pnpm dev
```

## 建置

```bash
pnpm build
```

建置結果會輸出到 `dist/`。

## GitHub Pages

本專案已包含 GitHub Actions 部署流程：

```text
.github/workflows/deploy.yml
```

推送到 `main` 分支後，GitHub Actions 會自動建置並部署到 GitHub Pages。

## 授權

本專案程式碼採用 MIT License。

遊戲相關名稱與資料歸原權利人所有，本工具僅做資料整理與計算輔助。
