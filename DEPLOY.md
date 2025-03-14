# Netlify 部署指南

本文档将指导你如何将"今天吃什么菜"应用部署到 Netlify。

## 准备工作

1. 确保你有一个 GitHub 账号
2. 确保你有一个 Netlify 账号（可以使用 GitHub 账号登录）
3. 将项目代码推送到 GitHub 仓库

## 部署步骤

### 1. 登录 Netlify

访问 [Netlify](https://www.netlify.com/) 并使用你的账号登录。

### 2. 创建新站点

在 Netlify 控制面板中，点击 "New site from Git" 按钮。

![新建站点](https://i.imgur.com/JAdcZq4.png)

### 3. 选择 Git 提供商

选择 "GitHub" 作为你的 Git 提供商。

![选择 Git 提供商](https://i.imgur.com/Y5wzHzL.png)

### 4. 授权 Netlify 访问你的 GitHub 仓库

按照提示完成授权过程。

### 5. 选择仓库

从列表中选择包含"今天吃什么菜"项目的仓库。

![选择仓库](https://i.imgur.com/MfXxMrb.png)

### 6. 配置构建设置

保持默认设置即可，因为这是一个静态网站，不需要构建过程。

- **构建命令**：留空
- **发布目录**：`.`（点号，表示根目录）

![构建设置](https://i.imgur.com/8FJCvTT.png)

### 7. 部署站点

点击 "Deploy site" 按钮开始部署。

### 8. 等待部署完成

Netlify 将自动部署你的网站。这个过程通常只需要几秒钟。

![部署中](https://i.imgur.com/LQizAZg.png)

### 9. 访问你的网站

部署完成后，Netlify 会自动分配一个域名给你的网站（例如 `https://your-site-name.netlify.app`）。你可以点击这个链接访问你的网站。

![部署完成](https://i.imgur.com/yTRpxLB.png)

## 自定义域名（可选）

如果你想使用自己的域名，可以在 Netlify 控制面板中进行设置：

1. 在站点概览页面，点击 "Domain settings"
2. 点击 "Add custom domain"
3. 输入你的域名并按照提示完成设置

## 更新网站

当你对代码进行更改并推送到 GitHub 仓库后，Netlify 会自动检测到更改并重新部署你的网站。你不需要手动触发部署。

## 常见问题

### 网站部署成功但无法访问

检查 `netlify.toml` 文件中的配置是否正确，特别是 Content-Security-Policy 设置。

### API 请求失败

确保你的 API 请求 URL 是 HTTPS 的，因为 Netlify 部署的网站是 HTTPS 的，不允许混合内容。

### 本地运行正常但部署后有问题

检查浏览器控制台中的错误信息，可能是路径问题或 CORS 问题。 