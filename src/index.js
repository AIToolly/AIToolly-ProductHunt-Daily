import { OpenAI } from 'openai';

// Create OpenAI client instance
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Get Product Hunt client ID and secret from environment variables
const producthunt_client_id = process.env.PRODUCTHUNT_CLIENT_ID;
const producthunt_client_secret = process.env.PRODUCTHUNT_CLIENT_SECRET;

// Define Product class for storing and processing product information
class Product {
  constructor({ id, name, tagline, description, votesCount, createdAt, featuredAt, website, url }) {
    // Initialize product properties
    this.name = name;
    this.tagline = tagline;
    this.description = description;
    this.votes_count = votesCount;
    this.created_at = this.convertToBeijingTime(createdAt);
    this.featured = featuredAt ? "Yes" : "No";
    this.website = website;
    this.url = url;
    this.og_image_url = "";
    this.keyword = "";
    this.translated_tagline = "";
    this.translated_description = "";
  }

  // Initialization method to get additional info and perform translations
  async initialize() {
    this.og_image_url = await this.fetchOgImageUrl();
    this.keyword = await this.generateKeywords();
    this.translated_tagline = await this.translateText(this.tagline);
    this.translated_description = await this.translateText(this.description);
  }

  // Fetch the product's Open Graph image URL
  async fetchOgImageUrl() {
    const response = await fetch(this.url);
    if (response.ok) {
      const html = await response.text();
      const match = html.match(/<meta property="og:image" content="([^"]+)"/);
      return match ? match[1] : "";
    }
    return "";
  }

  // Generate product keywords using OpenAI
  async generateKeywords() {
    // const prompt = `Generate suitable Chinese keywords based on the following content, separated by English commas:\n\nProduct Name: ${this.name}\n\nTagline: ${this.tagline}\n\nDescription: ${this.description}`;
    const prompt = `根据以下内容生成适合的中文关键词，用英文逗号分隔开：\n\n产品名称：${this.name}\n\n标语：${this.tagline}\n\n描述：${this.description}`;
    
    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Generate suitable Chinese keywords based on the product information provided. The keywords should be separated by commas." },
          { role: "user", content: prompt },
        ],
        max_tokens: 50,
        temperature: 0.7,
      });
      let keywords = response.choices[0].message.content.trim();
      if (!keywords.includes(',')) {
        keywords = keywords.split(' ').join(', ');
      }
      return keywords;
    } catch (e) {
      console.error(`Error occurred during keyword generation: ${e}`);
      return "Error generating keywords";
    }
  }

  // Translate text using OpenAI
  async translateText(text) {
    try {
      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "你是世界上最专业的翻译工具，擅长英文和中文互译。你是一位精通英文和中文的专业翻译，尤其擅长将IT公司黑话和专业词汇翻译成简洁易懂的地道表达。你的任务是将以下内容翻译成地道的中文，风格与科普杂志或日常对话相似。" },
          // { role: "system", content: "You are the world's most professional translation tool, specializing in English-Chinese translation. You are a professional translator proficient in both English and Chinese, especially skilled at translating IT company jargon and technical terms into concise and easy-to-understand authentic expressions. Your task is to translate the following content into idiomatic Chinese, with a style similar to popular science magazines or daily conversations." },
          { role: "user", content: text },
        ],
        max_tokens: 500,
        temperature: 0.7,
      });
      return response.choices[0].message.content.trim();
    } catch (e) {
      console.error(`Error occurred during translation: ${e}`);
      return "Error translating text";
    }
  }

  // Convert UTC time to Beijing time
  convertToBeijingTime(utcTimeStr) {
    const utcTime = new Date(utcTimeStr);
    const beijingTime = new Date(utcTime.getTime() + 8 * 60 * 60 * 1000);
    return beijingTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: true, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' (Beijing Time)';
  }

  // Generate Markdown format description for the product
  toMarkdown(rank) {
    const ogImageMarkdown = `![${this.name}](${this.og_image_url})`;
    return `## [${rank}. ${this.name}](${this.url})
**Tagline**: ${this.translated_tagline}
**Introduction**: ${this.translated_description}
**Product Website**: [Visit Now](${this.website})
**Product Hunt**: [View on Product Hunt](${this.url})

${ogImageMarkdown}

**Keywords**: ${this.keyword}
**Votes**: 🔺${this.votes_count}
**Featured**: ${this.featured}
**Launch Time**: ${this.created_at}

---

`;
  }
}

// Get Product Hunt access token
async function getProducthuntToken() {
  const url = "https://api.producthunt.com/v2/oauth/token";
  const payload = {
    client_id: producthunt_client_id,
    client_secret: producthunt_client_secret,
    grant_type: "client_credentials",
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to obtain access token: ${response.status}, ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Fetch data from Product Hunt
async function fetchProductHuntData() {
  const token = await getProducthuntToken();
  const yesterday = new Date(Date.now() - 86400000);
  const dateStr = yesterday.toISOString().split('T')[0];
  const url = "https://api.producthunt.com/v2/api/graphql";
  const headers = { "Authorization": `Bearer ${token}` };

  const baseQuery = `
  {
    posts(order: VOTES, postedAfter: "${dateStr}T00:00:00Z", postedBefore: "${dateStr}T23:59:59Z", after: "%s") {
      nodes {
        id
        name
        tagline
        description
        votesCount
        createdAt
        featuredAt
        website
        url
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  `;

  let allPosts = [];
  let hasNextPage = true;
  let cursor = "";

  // Loop to fetch all product data
  while (hasNextPage && allPosts.length < 30) {
    const query = baseQuery.replace('%s', cursor);
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch data from Product Hunt: ${response.status}, ${await response.text()}`);
    }

    const data = await response.json();
    const posts = data.data.posts.nodes;
    allPosts = allPosts.concat(posts);

    hasNextPage = data.data.posts.pageInfo.hasNextPage;
    cursor = data.data.posts.pageInfo.endCursor;
  }

  // Keep only the top 30 products and initialize them
  const products = allPosts.sort((a, b) => b.votesCount - a.votesCount).slice(0, 30).map(post => new Product(post));
  await Promise.all(products.map(product => product.initialize()));
  
  return products;
}

// Generate Markdown content
async function generateMarkdown(products, dateStr) {
  let markdownContent = `# PH Daily Hot | ${dateStr}\n\n`;
  products.forEach((product, index) => {
    markdownContent += product.toMarkdown(index + 1);
  });
  return markdownContent;
}

// Save data to D1 database
async function saveToD1(env, products, dateStr, markdownContent) {
  const db = env.DATABASE;

  // Save Markdown content
  await db.prepare('INSERT INTO markdown_content (date, content) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET content = excluded.content')
    .bind(dateStr, markdownContent)
    .run();

  // Save product data
  for (const product of products) {
    await db.prepare(`
      INSERT INTO products (
        date, name, tagline, description, votes_count, created_at, featured, website, url,
        og_image_url, keyword, translated_tagline, translated_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date, name) DO UPDATE SET
        tagline = excluded.tagline,
        description = excluded.description,
        votes_count = excluded.votes_count,
        created_at = excluded.created_at,
        featured = excluded.featured,
        website = excluded.website,
        url = excluded.url,
        og_image_url = excluded.og_image_url,
        keyword = excluded.keyword,
        translated_tagline = excluded.translated_tagline,
        translated_description = excluded.translated_description
    `).bind(
      dateStr,
      product.name,
      product.tagline,
      product.description,
      product.votes_count,
      product.created_at,
      product.featured,
      product.website,
      product.url,
      product.og_image_url,
      product.keyword,
      product.translated_tagline,
      product.translated_description
    ).run();
  }
}

// Export default object, including scheduled method for Cloudflare Worker cron job
export default {
  async scheduled(event, env, ctx) {
    const yesterday = new Date(Date.now() - 86400000);
    const dateStr = yesterday.toISOString().split('T')[0];

    try {
      const products = await fetchProductHuntData();
      const markdownContent = await generateMarkdown(products, dateStr);
      await saveToD1(env, products, dateStr, markdownContent);
      console.log(`Data for ${dateStr} has been successfully saved to D1.`);
    } catch (error) {
      console.error(`Error processing data for ${dateStr}:`, error);
    }
  },

  // Add fetch method to handle HTTP requests
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/trigger" && request.method === "POST") {
      const yesterday = new Date(Date.now() - 86400000);
      const dateStr = yesterday.toISOString().split('T')[0];

      try {
        const products = await fetchProductHuntData();
        const markdownContent = await generateMarkdown(products, dateStr);
        await saveToD1(env, products, dateStr, markdownContent);
        return new Response(`Data for ${dateStr} has been successfully processed and saved to D1.`, { status: 200 });
      } catch (error) {
        console.error(`Error processing data for ${dateStr}:`, error);
        return new Response(`Error processing data: ${error.message}`, { status: 500 });
      }
    }

    // Return 404 for other requests
    return new Response("Not Found", { status: 404 });
  }
};
