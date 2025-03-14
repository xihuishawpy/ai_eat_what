// Netlify 函数，用于同步菜品数据
const { getUserRecipes, saveUserRecipes } = require('./lib/db');

exports.handler = async function(event, context) {
  // 设置 CORS 头
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };
  
  // 处理 OPTIONS 请求（预检请求）
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }
  
  // 只允许 GET 和 POST 请求
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "方法不允许" })
    };
  }
  
  try {
    // 从查询参数中获取用户 ID
    const params = event.queryStringParameters || {};
    const userId = params.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "缺少用户 ID" })
      };
    }
    
    // GET 请求：获取用户的菜品数据
    if (event.httpMethod === "GET") {
      try {
        const recipes = await getUserRecipes(userId);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ recipes })
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: "获取菜品数据失败", details: error.message })
        };
      }
    }
    
    // POST 请求：更新用户的菜品数据
    if (event.httpMethod === "POST") {
      try {
        const data = JSON.parse(event.body);
        
        if (!data.recipes || !Array.isArray(data.recipes)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "无效的菜品数据格式" })
          };
        }
        
        // 更新用户的菜品数据
        const result = await saveUserRecipes(userId, data.recipes);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: "菜品数据已同步" })
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: "保存菜品数据失败", details: error.message })
        };
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "服务器错误", details: error.message })
    };
  }
}; 