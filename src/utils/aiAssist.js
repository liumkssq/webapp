// Webapp/src/utils/aiAssist.js
// 导入 LangChain 相关模块
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

/**
 * AI Assistant Utility Functions
 * 
 * API 密钥管理:
 * =======================
 * API Key 通过环境变量 `VITE_QWEN_API_KEY` 读取。
 * 请在项目根目录创建 `.env` 文件，并添加如下行:
 * VITE_QWEN_API_KEY=your_dashscope_api_key_here
 * 
 * 重要提示：
 * 即使使用环境变量，在标准的 Vite/Vue CLI 构建中，这些变量也会被嵌入到最终的前端代码包中。
 * 对于生产环境，最安全的方式仍然是使用后端代理来处理 API 调用和密钥。
 */

// 从环境变量读取 API Key (Vite 方式)
// 前缀 VITE_ 是必需的，以便 Vite 将其暴露给客户端代码
const apiKey = import.meta.env.VITE_QWEN_API_KEY;
const baseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const chatModel = "qwen-plus";

// 检查环境变量是否设置
if (!apiKey) {
  console.warn(
    "AI Assistant: VITE_QWEN_API_KEY environment variable is not set. " + 
    "Please create a .env file in the project root and add VITE_QWEN_API_KEY=your_key. " + 
    "Real AI calls will fail without a valid API key."
  );
  // 可以选择在此处抛出错误或让后续调用失败
}

// 配置 ChatOpenAI 实例以连接到 DashScope Qwen
const model = new ChatOpenAI({
  // apiKey 如果未设置或为空，ChatOpenAI 内部可能会尝试查找 OPENAI_API_KEY，但这里明确传递
  apiKey: apiKey || undefined, // 如果 apiKey 为空字符串或未定义，传递 undefined
  modelName: chatModel,
  temperature: 0.7, // 可以调整温度参数
  // streaming: true, // 如果需要流式输出，可以启用
  configuration: { // Nest baseURL inside configuration object
    baseURL: baseURL,
  }
});

// 创建输出解析器实例
const outputParser = new StringOutputParser();

/**
 * 根据上下文生成 AI 内容建议
 * @param {object} options
 * @param {'title' | 'description' | 'tags' | 'keywords'} options.contentType - 需要生成的内容类型
 * @param {object} options.context - 提供给 AI 的上下文信息
 * @param {'product' | 'lostfound'} options.context.contextType - 上下文类型
 * @param {'lost' | 'found'} [options.context.itemType] - 物品类型 (仅 lostfound 需要)
 * @param {string} [options.context.category] - 分类
 * @param {string} [options.context.title] - 标题
 * @param {string} [options.context.description] - 描述
 * @param {string} [options.context.location] - 地点 (仅 lostfound 需要)
 * @param {string} [options.context.eventTime] - 时间 (仅 lostfound 需要)
 * @param {string} [options.context.prompt] - 用户输入的提示
 * @returns {Promise<string>} - AI 生成的内容或错误信息
 */
export const generateContent = async ({ contentType, context }) => {
  console.log('AI Assistant: Generating content for', contentType, 'with context:', context);
  
  // 从上下文中解构所需信息，并提供默认值
  const {
    contextType = 'product', // 默认商品
    itemType = 'lost', // 默认丢失 (lostfound时)
    title = '',
    category = '',
    description = '',
    location = '', 
    eventTime = '',
    prompt: userPrompt = '' // alias prompt to userPrompt
  } = context;

  try {
    let promptTemplateString = "";
    let invokeContext = {};

    if (contextType === 'lostfound') {
      // --- 失物招领场景 --- 
      console.log(`AI Assistant: Handling lostfound context, itemType: ${itemType}`);
      const typeText = itemType === 'lost' ? '寻物启事' : '招领启事';
      const actionText = itemType === 'lost' ? '丢失' : '拾取';

      switch (contentType) {
        case 'title':
          promptTemplateString = `你是一个乐于助人的校园助手，正在帮助用户撰写${typeText}的标题。
          请根据以下信息，生成一个简洁明了的${typeText}标题 (最多30字)，清楚说明${actionText}了什么物品，可包含地点或时间特征。
          请务必参考用户的"生成提示"以满足其具体要求。

          物品分类: {category}
          ${actionText}地点: {location}
          ${actionText}时间: {eventTime}
          用户提示: {userPrompt}
          现有描述: {description}

          生成的${typeText}标题:`;
          invokeContext = { category: category || '未指定', location: location || '未指定', eventTime: eventTime || '未指定', userPrompt: userPrompt || '无', description: description || '无' };
          break;
        case 'description':
          promptTemplateString = `你是一个乐于助人的校园助手，正在帮助用户优化一份${typeText}。请根据用户提供的信息和要求，生成一段更清晰、信息更完整的${typeText}描述。
          请务必重点参考用户在"生成提示"中给出的具体要求或侧重点。
          **重要：请直接输出优化后的${typeText}文本，不要包含任何解释、前言或结尾。**

          物品分类: {category}
          ${actionText}地点: {location}
          ${actionText}时间: {eventTime}
          用户提示: {userPrompt}
          现有描述: {description}

          优化后的${typeText}描述:`;
          invokeContext = { category: category || '未指定', location: location || '未指定', eventTime: eventTime || '未指定', userPrompt: userPrompt || '无', description: description || '无' };
          break;
        case 'keywords': // 使用 keywords 代替 tags
          promptTemplateString = `你是一个帮助用户为${typeText}提取关键词的助手。
          请根据以下信息，生成 3-5 个最相关的关键词，用逗号分隔，例如物品名称、关键特征、地点、分类等。
          请参考用户的"生成提示"可能提到的侧重点。

          物品分类: {category}
          ${actionText}地点: {location}
          ${actionText}时间: {eventTime}
          用户提示: {userPrompt}
          描述: {description}

          生成的关键词:`;
          invokeContext = { category: category || '未指定', location: location || '未指定', eventTime: eventTime || '未指定', userPrompt: userPrompt || '无', description: description || '无' };
          break;
        default:
          throw new Error(`不支持的内容类型: ${contentType} (for lostfound)`);
      }
    } else {
      // --- 商品场景 (原有逻辑) --- 
      console.log(`AI Assistant: Handling product context`);
      switch (contentType) {
        case 'title':
          promptTemplateString = `你是一个帮助用户为二手商品生成吸引人标题的助手。
          请根据以下信息，生成一个简洁、有吸引力且包含关键信息的商品标题 (最多30字)。请参考用户的"生成提示"。

          商品分类: {category}
          用户提示: {userPrompt}
          现有描述: {description}

          生成的标题:`;
           invokeContext = { category: category || '未指定', userPrompt: userPrompt || '无', description: description || '无' };
          break;
        case 'description':
          promptTemplateString = `你是一个文本优化助手。请根据以下信息，生成一段更详细、更有吸引力、更流畅自然的商品描述。请保留关键信息，并适当润色。
          请务必重点参考用户在"生成提示"中给出的具体要求或侧重点。
          **重要：请直接输出优化后的描述文本，不要包含任何解释、前言或结尾。**

          商品分类: {category}
          商品标题: {title}
          用户提示: {userPrompt}
          现有描述: {description}

          优化后的描述:`;
          invokeContext = { category: category || '未指定', title: title || '无', userPrompt: userPrompt || '无', description: description || '无' };
          break;
        case 'tags':
          promptTemplateString = `你是一个帮助用户为二手商品生成相关标签的助手。
          请根据以下信息，生成 3-5 个最相关的标签，用逗号分隔。请参考用户的"生成提示"。

          商品分类: {category}
          商品标题: {title}
          用户提示: {userPrompt}
          描述: {description}

          生成的标签:`;
          invokeContext = { category: category || '未指定', title: title || '无', userPrompt: userPrompt || '无', description: description || '无' };
          break;
        default:
          throw new Error(`不支持的内容类型: ${contentType} (for product)`);
      }
    }

    // 创建 PromptTemplate 实例
    const prompt = PromptTemplate.fromTemplate(promptTemplateString);
    
    // 构建 LangChain 链
    const chain = prompt.pipe(model).pipe(outputParser);

    console.log(`AI Assistant: Invoking chain for ${contentType} (${contextType})...`);
    // 调用链并传入选择好的上下文信息
    const result = await chain.invoke(invokeContext);
    console.log(`AI Assistant: Received result for ${contentType} (${contextType}):`, result);

    // 返回成功的结果
    return result;

  } catch (error) {
    // 捕获并处理错误
    console.error(`AI content generation failed for ${contentType} (${contextType}):`, error);
    // 根据错误类型可以返回更具体的提示
    if (error.message?.includes('authentication') || error.message?.includes('401')) {
       return 'AI 助手认证失败，请检查 API Key 或网络连接。';
    }
    if (error.message?.includes('rate limit')) {
       return 'AI 助手调用频率过高，请稍后再试。';
    }
    // 返回通用的错误信息
    return `抱歉，AI 助手暂时无法工作 (${error.message || '未知错误'})，请稍后再试。`;
  }
};

// 可以根据需要添加其他 AI 相关函数，例如图片分析 (需要不同的模型和处理)
// export const analyzeImage = async (imageUrl) => { ... }

// 注意：关于 embeddingModel 和 embeddingURL 的信息可以在此注释
// Embedding Model Info (Not used in generateContent):
// embeddingModel = "text-embedding-v3"
// embeddingURL = "https://dashscope.aliyuncs.com/compatible-mode/v1" 
// (For future use with RAG or similarity search)

// 移除了不再需要的 getApiKeySecurely 示例函数 