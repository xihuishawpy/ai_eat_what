# 今天吃什么菜 🍽️

一个帮助你决定今天吃什么的智能菜谱应用。

## 功能特点

- 📝 记录和管理你的菜品集
- 🤖 AI 智能推荐菜品
- 🧪 根据已有食材推荐多种做法
- 🔍 按类别筛选菜品
- 💾 本地存储，无需登录
- 📱 响应式设计，适配各种设备

## 技术栈

- 前端：HTML5, CSS3, JavaScript (原生)
- AI 接口：智谱 AI GLM-4-flash 模型
- 部署：Netlify

## 主要功能

### 1. 添加新菜品

手动添加菜品信息，包括名称、食材和做法。系统会自动对菜品进行分类。

### 2. AI 推荐菜品

选择菜品类别，AI 会推荐一道菜品，包含详细的食材和做法。

### 3. 食材智能推荐

输入家里已有的食材，AI 会推荐 3 种不同的做法，并标注出哪些食材已有，哪些需要额外购买。

### 4. 菜品管理

查看、编辑和删除已保存的菜品，支持按类别筛选。

## 部署指南

### Netlify 部署

1. 注册/登录 [Netlify](https://www.netlify.com/)
2. 点击 "New site from Git"
3. 选择你的 Git 仓库
4. 构建设置保持默认
5. 点击 "Deploy site"

### 本地运行

1. 克隆仓库到本地
2. 使用任意 HTTP 服务器运行，例如：
   ```
   python -m http.server 8000
   ```
3. 在浏览器中访问 `http://localhost:8000`

## 使用说明

首次使用时，需要输入智谱 AI 的 API 密钥。你可以在 [智谱 AI 开放平台](https://open.bigmodel.cn/) 获取密钥。

## 许可证

MIT 