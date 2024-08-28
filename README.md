# AIToolly Product Hunt  数据爬取和 Markdown 生成工具
## 项目简介
本项目是基于 Cloudflare Worker、D1 数据库和 OpenAI API 的 Product Hunt 数据爬取和 Markdown 生成工具。它可以自动获取 Product Hunt 数据，生成 Markdown 内容，并将所有信息保存到 D1 数据库中。

## 项目来源
灵感来源：https://github.com/ViggoZ/producthunt-daily-hot
感谢作者：https://github.com/ViggoZ

基于原来的项目，修改了技术方案：
    1. 数据库使用Cloudflare D1
    2. 定时任务使用Cloudflare Workers
    3. 脚本部署在Cloudflare Workers

## 项目结构
- `src/index.js`: 主逻辑文件，负责数据爬取、处理和保存。

## 使用说明

### 准备工作
1. Cloudflare 账户设置：
   - 注册一个 Cloudflare 账户（如果还没有的话）。
   - 在 Cloudflare 中创建一个新的 Worker。

2. 环境变量设置：
   在 Cloudflare Worker 的设置中，添加以下环境变量：
   - `OPENAI_API_KEY`：您的 OpenAI API 密钥
   - `PRODUCTHUNT_CLIENT_ID`：您的 Product Hunt API 客户端 ID
   - `PRODUCTHUNT_CLIENT_SECRET`：您的 Product Hunt API 客户端密钥

### 数据库设置
3. D1 数据库设置：
   - 在 Cloudflare 中创建一个新的 D1 数据库。
   - 在数据库中创建以下两个表：
     a. `markdown_content` 表：
     ```sql
     CREATE TABLE markdown_content (
       date TEXT PRIMARY KEY,
       content TEXT
     );
     ```
     b. `products` 表：
     ```sql
     CREATE TABLE products (
       date TEXT,
       name TEXT,
       tagline TEXT,
       description TEXT,
       votes_count INTEGER,
       created_at TEXT,
       featured TEXT,
       website TEXT,
       url TEXT,
       og_image_url TEXT,
       keyword TEXT,
       translated_tagline TEXT,
       translated_description TEXT,
       PRIMARY KEY (date, name)
     );
     ```
   - 将 D1 数据库绑定到您的 Worker，绑定名称设为 `DATABASE`。
   - 将 `wrangler.toml` 中的 `database_id` 替换为您的 D1 数据库 ID。

### 代码部署
4. 依赖项安装：
   在项目目录中运行以下命令安装必要的依赖：
   ```
   npm install openai
   ```

5. 代码部署：
   - 将提供的 JavaScript 代码复制到您的 Worker 中。
   - 确保代码中的模型名称是正确的（例如，将 "gpt-4o-mini" 改为 "gpt-3.5-turbo" 或其他可用的模型）。

6. 定时任务设置：
   在 Cloudflare Worker 的设置中，设置一个定时触发器，例如每天凌晨 1 点运行：
   ```
   0 1 * * *
   ```

### 测试和维护
7. 部署和测试：
   - 部署您的 Worker。
   - 手动触发一次以测试是否正常工作。
   - 检查 D1 数据库中是否成功保存了数据。

8. 监控和日志：
   - 设置日志记录以便于调试和监控。
   - 定期检查 Worker 的运行状态和 D1 数据库的数据。

9. 安全性考虑：
   - 确保您的 API 密钥和客户端密钥安全存储。
   - 考虑设置 API 请求限制以避免超出使用限额。

10. 维护：
    - 定期检查 OpenAI 和 Product Hunt API 的更新，并相应地更新您的代码。
    - 监控 D1 数据库的存储使用情况，必要时进行数据清理。

## 结语
完成这些步骤后，您的 Cloudflare Worker 应该能够每天自动运行，获取 Product Hunt 数据，生成 Markdown 内容，并将所有信息保存到 D1 数据库中。

## 许可证
本项目基于 MIT 许可证开源 - 有关详细信息，请参阅 [LICENSE](LICENSE) 文件。
