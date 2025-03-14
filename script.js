// 存储菜品的数组
let recipes = [];

// 用户标识
let userId = null;

// DOM 元素
const recipeForm = document.getElementById('recipeForm');
const recipeContainer = document.getElementById('recipeContainer');
const filterButtons = document.querySelectorAll('.filter-btn');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const getRecommendationBtn = document.getElementById('getRecommendation');
const recommendationResult = document.getElementById('recommendationResult');
const getIngredientsRecommendationBtn = document.getElementById('getIngredientsRecommendation');
const ingredientsRecommendationResult = document.getElementById('ingredientsRecommendationResult');

// 智谱 AI API 配置
let ZHIPUAI_API_KEY = null;
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// 从 Netlify 函数获取 API 密钥
async function getApiKeyFromNetlify() {
    try {
        const response = await fetch('/api/getApiKey');
        if (!response.ok) {
            throw new Error('获取 API 密钥失败');
        }
        const data = await response.json();
        return data.apiKey;
    } catch (error) {
        console.error('从 Netlify 获取 API 密钥失败:', error);
        return null;
    }
}

// 生成唯一的用户 ID
function generateUserId() {
    // 生成一个随机的 UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 获取或创建用户 ID
function getUserId() {
    let id = localStorage.getItem('userId');
    if (!id) {
        id = generateUserId();
        localStorage.setItem('userId', id);
    }
    return id;
}

// 从服务器获取菜品数据
async function fetchRecipesFromServer() {
    try {
        console.log(`从服务器获取用户 ${userId} 的菜品数据...`);
        const response = await fetch(`/api/syncRecipes?userId=${userId}`);
        
        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`从服务器获取了 ${data.recipes.length} 个菜品`);
        return data.recipes;
    } catch (error) {
        console.error('从服务器获取菜品失败:', error);
        return null;
    }
}

// 将菜品数据同步到服务器
async function syncRecipesToServer() {
    try {
        console.log(`同步 ${recipes.length} 个菜品到服务器...`);
        const response = await fetch(`/api/syncRecipes?userId=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ recipes })
        });
        
        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('菜品同步成功:', data);
        return true;
    } catch (error) {
        console.error('同步菜品到服务器失败:', error);
        return false;
    }
}

// 安全地从 localStorage 获取数据
function safeGetFromLocalStorage(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        if (value === null) return defaultValue;
        return JSON.parse(value);
    } catch (error) {
        console.error(`从 localStorage 获取 ${key} 失败:`, error);
        return defaultValue;
    }
}

// 安全地保存数据到 localStorage
function safeSaveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`保存 ${key} 到 localStorage 失败:`, error);
        return false;
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', async () => {
    console.log('页面加载完成，开始初始化...');
    
    // 获取用户 ID
    userId = getUserId();
    console.log('用户 ID:', userId);
    
    // 显示同步状态
    showSyncStatus('正在加载数据...');
    
    // 尝试从服务器获取菜品数据
    const serverRecipes = await fetchRecipesFromServer();
    
    // 尝试从 localStorage 加载菜品数据
    const localRecipes = safeGetFromLocalStorage('recipes', []);
    console.log(`从 localStorage 加载了 ${localRecipes.length} 个菜品`);
    
    // 如果服务器有数据，使用服务器数据
    if (serverRecipes && serverRecipes.length > 0) {
        recipes = serverRecipes;
        console.log('使用服务器数据');
        
        // 如果本地数据与服务器数据不同，更新本地存储
        if (JSON.stringify(localRecipes) !== JSON.stringify(serverRecipes)) {
            safeSaveToLocalStorage('recipes', serverRecipes);
            console.log('已更新本地存储的菜品数据');
        }
    } else if (localRecipes && localRecipes.length > 0) {
        // 如果服务器没有数据但本地有，使用本地数据并同步到服务器
        recipes = localRecipes;
        console.log('使用本地数据并同步到服务器');
        
        // 同步到服务器
        const syncSuccess = await syncRecipesToServer();
        console.log(`同步到服务器${syncSuccess ? '成功' : '失败'}`);
    } else {
        // 两者都没有数据
        recipes = [];
        console.log('没有找到菜品数据');
    }
    
    // 隐藏同步状态
    hideSyncStatus();
    
    // 检查菜品数据是否有效
    if (!Array.isArray(recipes)) {
        console.warn('加载的菜品数据不是数组，重置为空数组');
        recipes = [];
    }
    
    // 尝试从 localStorage 加载 API 密钥
    try {
        ZHIPUAI_API_KEY = localStorage.getItem('ZHIPUAI_API_KEY');
        console.log('API 密钥状态:', ZHIPUAI_API_KEY ? '已设置' : '未设置');
    } catch (error) {
        console.error('加载 API 密钥失败:', error);
        ZHIPUAI_API_KEY = null;
    }
    
    // 检查是否已设置 API 密钥
    if (!ZHIPUAI_API_KEY) {
        console.log('尝试从 Netlify 函数获取 API 密钥...');
        // 尝试从 Netlify 函数获取 API 密钥
        const netlifyApiKey = await getApiKeyFromNetlify();
        if (netlifyApiKey) {
            ZHIPUAI_API_KEY = netlifyApiKey;
            try {
                localStorage.setItem('ZHIPUAI_API_KEY', netlifyApiKey);
                console.log('已从 Netlify 环境变量获取 API 密钥并保存');
            } catch (error) {
                console.error('保存 API 密钥到 localStorage 失败:', error);
            }
        } else {
            console.log('从 Netlify 获取 API 密钥失败，将提示用户输入');
            // 如果从 Netlify 获取失败，则提示用户输入
            const apiKey = prompt('请输入你的智谱 AI API 密钥：');
            if (apiKey) {
                ZHIPUAI_API_KEY = apiKey;
                try {
                    localStorage.setItem('ZHIPUAI_API_KEY', apiKey);
                    console.log('已保存用户输入的 API 密钥');
                } catch (error) {
                    console.error('保存用户输入的 API 密钥失败:', error);
                }
            }
        }
    }
    
    // 初始化日期时间显示
    updateDateTime();
    setInterval(updateDateTime, 1000); // 每秒更新一次
    
    // 渲染菜品列表
    console.log(`准备渲染 ${recipes.length} 个菜品`);
    renderRecipes();
    
    // 设置事件监听器
    setupEventListeners();
    
    console.log('页面初始化完成');
    
    // 如果菜品为空，显示提示信息
    if (recipes.length === 0) {
        recipeContainer.innerHTML = `
            <div class="empty-state">
                <p>你的菜品集还是空的，可以通过以下方式添加菜品：</p>
                <ul>
                    <li>使用上方的表单添加新菜品</li>
                    <li>使用 AI 推荐功能获取推荐菜品</li>
                    <li>使用食材推荐功能根据现有食材获取推荐</li>
                </ul>
            </div>
        `;
    }
    
    // 添加用户 ID 显示
    addUserIdDisplay();
});

// 显示同步状态
function showSyncStatus(message) {
    // 检查是否已存在同步状态元素
    let syncStatus = document.getElementById('syncStatus');
    
    if (!syncStatus) {
        // 创建同步状态元素
        syncStatus = document.createElement('div');
        syncStatus.id = 'syncStatus';
        syncStatus.className = 'sync-status';
        document.body.appendChild(syncStatus);
    }
    
    syncStatus.textContent = message;
    syncStatus.style.display = 'block';
}

// 隐藏同步状态
function hideSyncStatus() {
    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) {
        syncStatus.style.display = 'none';
    }
}

// 添加用户 ID 显示
function addUserIdDisplay() {
    const userIdDisplay = document.createElement('div');
    userIdDisplay.className = 'user-id-display';
    userIdDisplay.innerHTML = `
        <p>设备 ID: <span>${userId.substring(0, 8)}...</span></p>
        <button id="copyUserId" class="copy-btn">复制完整 ID</button>
        <button id="importData" class="import-btn">导入数据</button>
    `;
    
    // 添加到页面
    const header = document.querySelector('header');
    if (header) {
        header.appendChild(userIdDisplay);
    }
    
    // 添加复制按钮事件
    const copyBtn = document.getElementById('copyUserId');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(userId).then(() => {
                alert('设备 ID 已复制到剪贴板');
            }).catch(err => {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制: ' + userId);
            });
        });
    }
    
    // 添加导入数据按钮事件
    const importBtn = document.getElementById('importData');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            const importId = prompt('请输入要导入数据的设备 ID:');
            if (importId && importId.trim()) {
                importDataFromUserId(importId.trim());
            }
        });
    }
}

// 从其他用户 ID 导入数据
async function importDataFromUserId(importId) {
    try {
        showSyncStatus('正在导入数据...');
        
        // 从服务器获取指定用户 ID 的数据
        const response = await fetch(`/api/syncRecipes?userId=${importId}`);
        
        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.recipes || !Array.isArray(data.recipes)) {
            throw new Error('获取的数据格式不正确');
        }
        
        if (data.recipes.length === 0) {
            alert('该设备 ID 没有菜品数据');
            hideSyncStatus();
            return;
        }
        
        // 确认导入
        if (confirm(`找到 ${data.recipes.length} 个菜品，确定要导入吗？这将覆盖你当前的菜品数据。`)) {
            // 更新本地数据
            recipes = data.recipes;
            
            // 保存到本地存储
            safeSaveToLocalStorage('recipes', recipes);
            
            // 同步到当前用户的服务器数据
            await syncRecipesToServer();
            
            // 重新渲染
            renderRecipes();
            
            alert('数据导入成功！');
        }
    } catch (error) {
        console.error('导入数据失败:', error);
        alert(`导入数据失败: ${error.message}`);
    } finally {
        hideSyncStatus();
    }
}

// 更新日期时间显示
function updateDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[now.getDay()];
    
    document.querySelector('.date').textContent = `${year}年${month}月${date}日`;
    document.querySelector('.time').textContent = `${hours}:${minutes}:${seconds}`;
    document.querySelector('.weekday').textContent = weekday;
}

// 设置事件监听器
function setupEventListeners() {
    // 表单提交
    recipeForm.addEventListener('submit', handleSubmit);
    
    // 编辑表单提交
    editForm.addEventListener('submit', handleEditSubmit);
    
    // 分类过滤
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterRecipes(button.dataset.category);
        });
    });
    
    // AI 推荐
    getRecommendationBtn.addEventListener('click', getRecommendation);
    
    // 食材推荐
    getIngredientsRecommendationBtn.addEventListener('click', getIngredientsRecommendation);
}

// 处理表单提交
async function handleSubmit(e) {
    e.preventDefault();
    
    const dishName = document.getElementById('dishName').value;
    const ingredients = document.getElementById('ingredients').value;
    const instructions = document.getElementById('instructions').value;
    
    // 调用智谱 AI API 进行分类
    const category = await classifyDish(dishName, ingredients);
    
    // 创建新菜品对象
    const newRecipe = {
        id: Date.now(),
        name: dishName,
        ingredients: ingredients.split('\n').filter(item => item.trim()),
        instructions: instructions.split('\n').filter(item => item.trim()),
        category: category,
        createdAt: new Date().toISOString()
    };
    
    // 添加到数组并保存
    recipes.push(newRecipe);
    saveRecipes();
    
    // 重新渲染
    renderRecipes();
    
    // 重置表单
    recipeForm.reset();
}

// 处理编辑表单提交
async function handleEditSubmit(e) {
    e.preventDefault();
    
    const id = parseInt(document.getElementById('editId').value);
    const dishName = document.getElementById('editDishName').value;
    const ingredients = document.getElementById('editIngredients').value;
    const instructions = document.getElementById('editInstructions').value;
    
    // 调用智谱 AI API 进行分类
    const category = await classifyDish(dishName, ingredients);
    
    // 更新菜品
    const index = recipes.findIndex(recipe => recipe.id === id);
    if (index !== -1) {
        recipes[index] = {
            ...recipes[index],
            name: dishName,
            ingredients: ingredients.split('\n').filter(item => item.trim()),
            instructions: instructions.split('\n').filter(item => item.trim()),
            category: category
        };
        
        saveRecipes();
        renderRecipes();
        closeModal();
    }
}

// 打开编辑模态框
function openEditModal(recipe) {
    document.getElementById('editId').value = recipe.id;
    document.getElementById('editDishName').value = recipe.name;
    document.getElementById('editIngredients').value = recipe.ingredients.join('\n');
    document.getElementById('editInstructions').value = recipe.instructions.join('\n');
    editModal.style.display = 'block';
}

// 关闭编辑模态框
function closeModal() {
    editModal.style.display = 'none';
}

// 删除菜品
function deleteRecipe(id) {
    if (confirm('确定要删除这个菜品吗？')) {
        recipes = recipes.filter(recipe => recipe.id !== id);
        saveRecipes();
        renderRecipes();
    }
}

// 获取 AI 推荐
async function getRecommendation() {
    const category = document.getElementById('recommendCategory').value;
    if (!category) {
        alert('请选择菜品类别');
        return;
    }
    
    if (!ZHIPUAI_API_KEY) {
        alert('请先设置智谱 AI API 密钥');
        const apiKey = prompt('请输入你的智谱 AI API 密钥：');
        if (apiKey) {
            ZHIPUAI_API_KEY = apiKey;
            localStorage.setItem('ZHIPUAI_API_KEY', apiKey);
        } else {
            return;
        }
    }

    try {
        // 显示加载状态
        recommendationResult.innerHTML = '<div class="loading-message">正在获取推荐，请稍候...</div>';
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ZHIPUAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "glm-4-flash",
                messages: [
                    {
                        role: "user",
                        content: `请推荐一道${getCategoryName(category)}，包含以下信息：
1. 菜品名称
2. 所需食材（每行一个）
3. 详细做法（每行一个步骤）
请严格按照以下 JSON 格式返回，不要添加任何其他内容：
{
    "name": "菜品名称",
    "ingredients": ["食材1", "食材2", ...],
    "instructions": ["步骤1", "步骤2", ...]
}`
                    }
                ]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API 请求失败: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API 返回数据:', data); // 添加调试日志
        
        if (!data.choices || !data.choices[0]?.message?.content) {
            throw new Error('API 返回数据格式不正确');
        }
        
        let recommendation;
        try {
            // 尝试清理返回的内容，移除可能的非 JSON 内容
            const content = data.choices[0].message.content.trim();
            console.log('API 返回的原始内容:', content); // 添加调试日志
            
            // 尝试提取 JSON 部分
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                recommendation = JSON.parse(jsonMatch[0]);
            } else {
                recommendation = JSON.parse(content);
            }
            
            console.log('解析后的推荐数据:', recommendation); // 添加调试日志
        } catch (parseError) {
            console.error('解析推荐数据失败:', parseError);
            console.error('原始数据:', data.choices[0].message.content);
            throw new Error(`解析推荐数据失败: ${parseError.message}`);
        }
        
        // 验证推荐数据格式
        if (!recommendation.name || !Array.isArray(recommendation.ingredients) || !Array.isArray(recommendation.instructions)) {
            console.error('推荐数据格式不正确:', recommendation);
            throw new Error('推荐数据格式不正确，缺少必要字段');
        }
        
        // 显示推荐结果
        recommendationResult.innerHTML = `
            <div class="recipe-card">
                <h3>${recommendation.name}</h3>
                <span class="category">${getCategoryName(category)}</span>
                <div class="ingredients">
                    <h4>食材：</h4>
                    <ul>
                        ${recommendation.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                </div>
                <div class="instructions">
                    <h4>做法：</h4>
                    <ol>
                        ${recommendation.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                    </ol>
                </div>
                <button class="save-recommendation-btn action-btn" onclick="saveRecommendation(${JSON.stringify(recommendation).replace(/"/g, '&quot;')})">
                    保存到我的菜品集 💾
                </button>
            </div>
        `;
    } catch (error) {
        console.error('获取推荐失败:', error);
        recommendationResult.innerHTML = `
            <div class="error-message">
                <p>获取推荐失败：${error.message}</p>
                <p>请检查：</p>
                <ul>
                    <li>API 密钥是否正确</li>
                    <li>网络连接是否正常</li>
                    <li>API 调用次数是否超限</li>
                    <li>API 返回的数据格式是否符合要求</li>
                </ul>
                <button class="retry-btn" onclick="getRecommendation()">重试 🔄</button>
            </div>
        `;
    }
}

// 保存推荐菜品
function saveRecommendation(recommendation) {
    const newRecipe = {
        id: Date.now(),
        name: recommendation.name,
        ingredients: recommendation.ingredients,
        instructions: recommendation.instructions,
        category: document.getElementById('recommendCategory').value,
        createdAt: new Date().toISOString()
    };
    
    recipes.push(newRecipe);
    saveRecipes();
    renderRecipes();
    recommendationResult.innerHTML = '<p>已保存到我的菜品集！</p>';
}

// 获取类别中文名称
function getCategoryName(category) {
    const categoryMap = {
        'vegetable': '蔬菜',
        'meat': '肉类',
        'seafood': '海鲜',
        'soup': '汤类'
    };
    return categoryMap[category] || category;
}

// 调用智谱 AI API 进行分类
async function classifyDish(dishName, ingredients) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ZHIPUAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "glm-4-flash",
                messages: [
                    {
                        role: "user",
                        content: `请将以下菜品分类为：蔬菜、肉类、海鲜、汤类中的一种。只返回分类结果，不要其他解释。\n菜品名称：${dishName}\n食材：${ingredients}`
                    }
                ]
            })
        });
        
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('分类失败:', error);
        return '未分类';
    }
}

// 渲染菜品列表
function renderRecipes(filteredRecipes = recipes) {
    recipeContainer.innerHTML = filteredRecipes.map(recipe => `
        <div class="recipe-card">
            <h3>${recipe.name}</h3>
            <span class="category">${getCategoryName(recipe.category)}</span>
            <div class="ingredients">
                <h4>食材：</h4>
                <ul>
                    ${recipe.ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                </ul>
            </div>
            <div class="instructions">
                <h4>做法：</h4>
                <ol>
                    ${recipe.instructions.map(instruction => `<li>${instruction}</li>`).join('')}
                </ol>
            </div>
            <div class="actions">
                <button class="action-btn edit-btn" onclick="openEditModal(${JSON.stringify(recipe).replace(/"/g, '&quot;')})">
                    编辑 ✏️
                </button>
                <button class="action-btn delete-btn" onclick="deleteRecipe(${recipe.id})">
                    删除 🗑️
                </button>
            </div>
        </div>
    `).join('');
}

// 过滤菜品
function filterRecipes(category) {
    const filteredRecipes = category === 'all' 
        ? recipes 
        : recipes.filter(recipe => recipe.category === category);
    renderRecipes(filteredRecipes);
}

// 保存到本地存储
function saveRecipes() {
    const success = safeSaveToLocalStorage('recipes', recipes);
    console.log(`保存菜品${success ? '成功' : '失败'}，共 ${recipes.length} 个菜品`);
    
    // 如果保存失败，尝试清理后再保存
    if (!success && recipes.length > 0) {
        try {
            // 尝试清理 localStorage
            localStorage.clear();
            console.log('已清理 localStorage，尝试重新保存');
            
            // 重新保存
            const retrySuccess = safeSaveToLocalStorage('recipes', recipes);
            console.log(`重新保存${retrySuccess ? '成功' : '失败'}`);
        } catch (error) {
            console.error('清理并重新保存失败:', error);
        }
    }
    
    // 同步到服务器
    syncRecipesToServer().then(success => {
        console.log(`同步到服务器${success ? '成功' : '失败'}`);
    });
}

// 获取食材推荐
async function getIngredientsRecommendation() {
    const ingredients = document.getElementById('userIngredients').value.trim();
    if (!ingredients) {
        alert('请输入食材');
        return;
    }
    
    if (!ZHIPUAI_API_KEY) {
        alert('请先设置智谱 AI API 密钥');
        const apiKey = prompt('请输入你的智谱 AI API 密钥：');
        if (apiKey) {
            ZHIPUAI_API_KEY = apiKey;
            localStorage.setItem('ZHIPUAI_API_KEY', apiKey);
        } else {
            return;
        }
    }

    try {
        // 显示加载状态
        ingredientsRecommendationResult.innerHTML = '<div class="loading-message">正在分析食材并生成推荐，请稍候...</div>';
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ZHIPUAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "glm-4-flash",
                messages: [
                    {
                        role: "user",
                        content: `我家有以下食材：${ingredients}。请推荐3种不同的菜品做法，每种做法包含：
1. 菜品名称
2. 所需食材（标注出我已有的食材和需要额外购买的食材）
3. 详细烹饪步骤

请用JSON格式返回，格式如下：
{
  "recipes": [
    {
      "name": "菜品1名称",
      "ingredients": {
        "available": ["已有食材1", "已有食材2", ...],
        "additional": ["需额外购买食材1", "需额外购买食材2", ...]
      },
      "steps": ["步骤1", "步骤2", ...]
    },
    {
      "name": "菜品2名称",
      "ingredients": {
        "available": ["已有食材1", "已有食材2", ...],
        "additional": ["需额外购买食材1", "需额外购买食材2", ...]
      },
      "steps": ["步骤1", "步骤2", ...]
    },
    {
      "name": "菜品3名称",
      "ingredients": {
        "available": ["已有食材1", "已有食材2", ...],
        "additional": ["需额外购买食材1", "需额外购买食材2", ...]
      },
      "steps": ["步骤1", "步骤2", ...]
    }
  ]
}`
                    }
                ]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API 请求失败: ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API 返回数据:', data);
        
        if (!data.choices || !data.choices[0]?.message?.content) {
            throw new Error('API 返回数据格式不正确');
        }
        
        let recommendations;
        try {
            // 尝试清理返回的内容，移除可能的非 JSON 内容
            const content = data.choices[0].message.content.trim();
            console.log('API 返回的原始内容:', content);
            
            // 尝试提取 JSON 部分
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                recommendations = JSON.parse(jsonMatch[0]);
            } else {
                recommendations = JSON.parse(content);
            }
            
            console.log('解析后的推荐数据:', recommendations);
        } catch (parseError) {
            console.error('解析推荐数据失败:', parseError);
            console.error('原始数据:', data.choices[0].message.content);
            throw new Error(`解析推荐数据失败: ${parseError.message}`);
        }
        
        // 验证推荐数据格式
        if (!recommendations.recipes || !Array.isArray(recommendations.recipes) || recommendations.recipes.length === 0) {
            throw new Error('推荐数据格式不正确，缺少必要字段');
        }
        
        // 显示推荐结果
        const recipesHtml = recommendations.recipes.map(recipe => `
            <div class="recipe-suggestion-card">
                <h3>${recipe.name}</h3>
                <div class="ingredients-list">
                    <h4>食材：</h4>
                    <ul>
                        ${recipe.ingredients.available.map(ingredient => `<li>${ingredient} <span class="ingredients-match">已有</span></li>`).join('')}
                        ${recipe.ingredients.additional.map(ingredient => `<li>${ingredient}</li>`).join('')}
                    </ul>
                </div>
                <div class="cooking-steps">
                    <h4>做法：</h4>
                    <ol>
                        ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
                    </ol>
                </div>
                <button class="save-suggestion-btn" onclick="saveSuggestion(${JSON.stringify(recipe).replace(/"/g, '&quot;')})">
                    保存到我的菜品集 💾
                </button>
            </div>
        `).join('');
        
        ingredientsRecommendationResult.innerHTML = `
            <h3>根据你的食材，推荐以下菜品：</h3>
            <div class="recipe-suggestions">
                ${recipesHtml}
            </div>
        `;
    } catch (error) {
        console.error('获取食材推荐失败:', error);
        ingredientsRecommendationResult.innerHTML = `
            <div class="error-message">
                <p>获取食材推荐失败：${error.message}</p>
                <p>请检查：</p>
                <ul>
                    <li>API 密钥是否正确</li>
                    <li>网络连接是否正常</li>
                    <li>API 调用次数是否超限</li>
                    <li>API 返回的数据格式是否符合要求</li>
                </ul>
                <button class="retry-btn" onclick="getIngredientsRecommendation()">重试 🔄</button>
            </div>
        `;
    }
}

// 保存食材推荐的菜品
function saveSuggestion(recipe) {
    const allIngredients = [...recipe.ingredients.available, ...recipe.ingredients.additional];
    
    const newRecipe = {
        id: Date.now(),
        name: recipe.name,
        ingredients: allIngredients,
        instructions: recipe.steps,
        category: detectCategory(recipe.name, allIngredients.join(',')),
        createdAt: new Date().toISOString()
    };
    
    recipes.push(newRecipe);
    saveRecipes();
    renderRecipes();
    
    // 显示保存成功消息
    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '已保存 ✅';
    button.disabled = true;
    button.style.backgroundColor = '#4ecdc4';
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
        button.style.backgroundColor = '';
    }, 2000);
}

// 根据菜名和食材检测可能的分类
function detectCategory(name, ingredients) {
    const lowerName = name.toLowerCase();
    const lowerIngredients = ingredients.toLowerCase();
    
    if (lowerIngredients.includes('肉') || lowerName.includes('肉') || 
        lowerIngredients.includes('牛') || lowerIngredients.includes('猪') || 
        lowerIngredients.includes('鸡') || lowerIngredients.includes('羊')) {
        return 'meat';
    } else if (lowerIngredients.includes('鱼') || lowerIngredients.includes('虾') || 
               lowerIngredients.includes('蟹') || lowerIngredients.includes('贝') ||
               lowerName.includes('海鲜')) {
        return 'seafood';
    } else if (lowerName.includes('汤') || lowerName.includes('羹')) {
        return 'soup';
    } else {
        return 'vegetable';
    }
} 