// Netlify 函数，用于安全地获取 API 密钥
exports.handler = async function(event, context) {
  // 检查请求方法
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    // 从环境变量获取 API 密钥
    const apiKey = process.env.ZHIPUAI_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "API 密钥未设置" })
      };
    }
    
    // 返回 API 密钥
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // 设置 CORS 头，只允许你的网站访问
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({ apiKey })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "获取 API 密钥失败" })
    };
  }
}; 