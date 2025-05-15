// Webapp/src/utils/aiAssist.js
// 导入 LangChain 相关模块
import { StringOutputParser, StructuredOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
// import { initializeAgentExecutorWithOptions } from "langchain/agents";
// import { z } from "zod"; // Uncomment if you use Zod for schema definition

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
const apiKey = import.meta.env.VITE_QWEN_API_KEY || "YOUR_API_KEY";
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
  streaming: false, // 默认为非流式输出，可通过参数开启流式输出
  configuration: { // Nest baseURL inside configuration object
    baseURL: baseURL,
  }
});

// 创建输出解析器实例 (供 generateContent 使用)
const outputParser = new StringOutputParser();

// 为 Agent 创建独立的 ChatOpenAI 实例，确保配置一致
const agentModel = new ChatOpenAI({
  apiKey: apiKey || undefined,
  modelName: chatModel,
  temperature: 0.7, // Agent 可能需要不同的 temperature 设置
  streaming: false, // 默认为非流式输出，可通过参数开启流式输出
  configuration: {
    baseURL: baseURL,
  }
});

// 创建支持流式输出的模型实例
const streamingModel = new ChatOpenAI({
  apiKey: apiKey || undefined,
  modelName: chatModel,
  temperature: 0.7,
  streaming: true, // 启用流式输出
  configuration: {
    baseURL: baseURL,
  }
});

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

/**
 * 创建一个具有对话记忆的AI代理执行器 (简化版实现)
 * @param {object} [options]
 * @param {string} [options.systemMessage] - 给代理的系统提示/角色设定
 * @param {boolean} [options.useStreaming=false] - 是否使用流式输出
 * @returns {Promise<object>} - 返回具有invoke方法的对象
 */
export const createConversationalAgent = async (options = {}) => {
  // 使用系统消息或默认消息
  const systemMessage = options.systemMessage || 
    `你是一个乐于助人的校园助手，请友好并清晰地回答用户的问题。如果你不知道答案，就说不知道。`;
  const useStreaming = options.useStreaming !== undefined ? options.useStreaming : false;
  
  console.log("AI Agent: Creating simplified conversational agent...", useStreaming ? "with streaming" : "without streaming");
  
  try {
    // 创建一个标准的提示模板，包含系统消息和用户输入
    const promptTemplate = PromptTemplate.fromTemplate(
      `${systemMessage}
      
历史对话:
{chat_history}

用户: {input}

助手:`
    );
    
    // 创建基本的对话记忆 (使用简单数组)
    const chatHistory = [];
    
    // 返回一个模拟的agent执行器
    return {
      async invoke({ input, onToken }) {
        try {
          console.log("AI Agent: Processing user input:", input);
          
          // 构建包含历史记录的上下文
          const formattedChatHistory = chatHistory.join("\n");
          
          // 选择合适的模型（流式或非流式）
          const selectedModel = useStreaming && onToken ? streamingModel : model;
          
          // 创建并执行chain
          const chain = promptTemplate
            .pipe(selectedModel)
            .pipe(new StringOutputParser());
          
          let response = "";
          
          // 如果使用流式输出并提供了onToken回调
          if (useStreaming && onToken && typeof onToken === 'function') {
            console.log("AI Agent: Using streaming response mode");
            response = await new Promise(async (resolve) => {
              let fullText = "";
              
              try {
                // 使用正确的异步迭代器处理方式替代forEach
                const stream = await chain.stream({
                  chat_history: formattedChatHistory,
                  input: input
                });
                
                // 使用for await...of迭代异步迭代器
                for await (const token of stream) {
                  fullText += token; // 收集完整文本
                  onToken(token); // 调用回调以向UI发送片段
                }
                
                resolve(fullText); // 所有令牌流完成后返回完整文本
              } catch (err) {
                console.error("Stream processing error:", err);
                resolve(`抱歉，生成回答时出错 (${err.message || '未知错误'})`);
              }
            });
          } else {
            // 标准非流式调用
            console.log("AI Agent: Using standard response mode");
            response = await chain.invoke({
              chat_history: formattedChatHistory,
              input: input
            });
          }
          
          // 将对话添加到历史记录
          chatHistory.push(`用户: ${input}`);
          chatHistory.push(`助手: ${response}`);
          
          // 如果历史记录太长，删除最早的交互
          if (chatHistory.length > 10) { // 保留最近5轮对话
            chatHistory.shift(); // 删除最早的用户输入
            chatHistory.shift(); // 删除最早的AI响应
          }
          
          console.log("AI Agent: Response generated successfully");
          return { output: response };
        } catch (error) {
          console.error("AI Agent: Error during invocation:", error);
          return { 
            output: `抱歉，我无法处理您的请求。(${error.message || '未知错误'})` 
          };
        }
      }
    };
  } catch (error) {
    console.error("AI Agent: Failed to create conversational agent:", error);
    // 返回一个模拟的 executor，确保调用方不会崩溃
    return { 
      async invoke(inputs) { 
        console.error("AI Agent: Invoked a failed-to-create agent with inputs:", inputs);
        return Promise.resolve({ output: "抱歉，对话助手创建失败，暂时无法响应。" });
      }
    };
  }
};

// 为兼容性和缓存问题提供一个后备方案
// 这个fallback对象与原始函数返回的对象有相同的API
export const fallbackAgent = {
  async invoke({ input, onToken }) {
    console.warn("AI Agent: Using fallback agent");
    const message = `AI助手暂时无法使用，请刷新页面后重试。您的输入是：${input}`;
    
    // 如果提供了流式回调，模拟流式输出
    if (typeof onToken === 'function') {
      const words = message.split(' ');
      let delay = 0;
      
      // 模拟流式响应
      for (const word of words) {
        delay += 100;
        setTimeout(() => onToken(word + ' '), delay);
      }
    }
    
    return {
      output: message
    };
  }
};

// 提供备选导出方式，解决缓存问题
// 如果加载旧版本的文件，这个默认导出可能会被使用
export default {
  createConversationalAgent,
  fallbackAgent
};

/**
 * 分析图片并提供智能建议
 * @param {Array} images - 图片数组，每个图片对象应有 url 属性
 * @param {Object} options - 可选配置
 * @param {string} options.contextType - 上下文类型，如 'product'、'lostfound'
 * @param {string} options.existingTitle - 现有标题
 * @param {string} options.existingDescription - 现有描述
 * @returns {Promise<Object>} 分析结果对象
 */
export async function analyzeImages(images, options = {}) {
  if (!images || !images.length || !images[0].url) {
    return { 
      error: "没有有效的图片URL"
    };
  }

  try {
    // 构建模型输出结构
    const imageAnalysisSchema = z.object({
      title: z.string().describe("建议的标题，简短有吸引力"),
      description: z.string().describe("详细描述，应包含图片中物品的关键特征"),
      tags: z.array(z.string()).describe("相关标签，用于分类和搜索"),
      analysis: z.string().describe("对图片的整体分析和见解")
    });

    // 创建结构化输出解析器
    const parser = StructuredOutputParser.fromZodSchema(imageAnalysisSchema);
    const formatInstructions = parser.getFormatInstructions();

    // 不同上下文类型的提示词调整
    let contextPrompt = "";
    if (options.contextType === 'product') {
      contextPrompt = "这些图片展示的是准备出售的二手商品。请分析商品的外观、品相、功能特点等。";
    } else if (options.contextType === 'lostfound') {
      contextPrompt = "这些图片展示的是失物招领或寻物启事中的物品。请详细分析物品的特征，以便于失主辨认。";
    }

    // 获取图片URL列表
    const imageUrls = images.map(img => img.url);
    
    // 准备标题和描述信息
    const existingTitle = options.existingTitle ? `用户已提供的标题: ${options.existingTitle}` : '';
    const existingDescription = options.existingDescription ? `用户已提供的描述: ${options.existingDescription}` : '';
    
    // 增强提示以确保模型理解图片URL并产生严格的JSON输出
    const enhancedPrompt = PromptTemplate.fromTemplate(`
    你是一位专业的图片分析助手。请分析以下图片URL所展示的内容。这些是可直接访问的图片URL，请确保处理它们:
    
    图片URL列表:
    {imageUrls}
    
    {contextPrompt}
    
    {existingTitle}
    {existingDescription}
    
    请提供一个全面的分析，包括:
    1. 根据图片内容，提供一个吸引人的标题
    2. 详细描述图片中的物品/内容
    3. 推荐相关的标签（5-7个）
    4. 对图片内容的整体分析和见解
    
    重要：即使你无法完全访问图片，也请基于URL和上下文给出合理的分析结果。请严格按照以下格式返回JSON:
    
    {formatInstructions}
    
    不要在JSON外添加任何额外文字、解释或标点符号。
    `);

    // 初始化LangChain模型 - 使用Qwen多模态模型
    const model = new ChatOpenAI({
      modelName: "qwen-vl-plus", // 使用Qwen的多模态模型
      temperature: 0.7,
      apiKey: apiKey,
      configuration: {
        baseURL: baseURL,
      }
    });

    // 执行模型调用，先用StringOutputParser获取原始响应
    const outputParser = new StringOutputParser();
    const rawChain = enhancedPrompt.pipe(model).pipe(outputParser);
    
    console.log("AI Assistant: 正在分析图片，图片URL:", imageUrls);
    
    // 运行链并获取原始响应
    const rawResponse = await rawChain.invoke({
      imageUrls: imageUrls.join('\n'),
      contextPrompt: contextPrompt,
      existingTitle: existingTitle,
      existingDescription: existingDescription,
      formatInstructions: formatInstructions
    });
    
    console.log("AI Assistant: 获取到原始响应");
    
    // 尝试提取JSON
    let parsedResponse;
    try {
      // 使用结构化解析器解析响应
      parsedResponse = await parser.parse(rawResponse);
      console.log("AI Assistant: 结构化解析成功");
    } catch (parseError) {
      console.error("结构化解析失败，尝试手动提取JSON:", parseError);
      
      // 尝试从文本中提取JSON
      const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                      rawResponse.match(/\{[\s\S]*"title"[\s\S]*"description"[\s\S]*"tags"[\s\S]*"analysis"[\s\S]*\}/);
                      
      if (jsonMatch && jsonMatch[1]) {
        try {
          // 尝试解析提取的JSON
          parsedResponse = JSON.parse(jsonMatch[1].trim());
          console.log("AI Assistant: 手动提取JSON成功");
        } catch (jsonError) {
          console.error("手动JSON解析失败:", jsonError);
          // 使用正则表达式提取每个字段
          const titleMatch = rawResponse.match(/"title"\s*:\s*"([^"]*)"/);
          const descriptionMatch = rawResponse.match(/"description"\s*:\s*"([^"]*)"/);
          const analysisMatch = rawResponse.match(/"analysis"\s*:\s*"([^"]*)"/);
          
          // 提取标签数组
          let tags = [];
          const tagsMatch = rawResponse.match(/"tags"\s*:\s*\[([\s\S]*?)\]/);
          if (tagsMatch) {
            const tagItems = tagsMatch[1].match(/"([^"]*)"/g);
            if (tagItems) {
              tags = tagItems.map(tag => tag.replace(/"/g, ''));
            }
          }
          
          parsedResponse = {
            title: titleMatch ? titleMatch[1] : "未能识别物品",
            description: descriptionMatch ? descriptionMatch[1] : "无法提取物品描述",
            tags: tags.length > 0 ? tags : ["未能提取标签"],
            analysis: analysisMatch ? analysisMatch[1] : "无法分析图片内容"
          };
          console.log("AI Assistant: 使用正则表达式提取字段成功");
        }
      } else {
        // 如果无法提取JSON，创建默认响应
        console.log("AI Assistant: 无法从响应中提取JSON，使用默认值和关键词提取");
        
        // 从原始响应中提取有用信息
        const lines = rawResponse.split('\n').filter(line => line.trim());
        let extractedTitle = "未能识别物品";
        let extractedDescription = "无法提取物品描述";
        let extractedAnalysis = "无法分析图片内容";
        let extractedTags = ["未能提取标签"];
        
        // 从原始文本中寻找相关段落
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].toLowerCase();
          if (line.includes('标题') || line.includes('title')) {
            extractedTitle = lines[i+1] ? lines[i+1].trim() : extractedTitle;
          } else if (line.includes('描述') || line.includes('description')) {
            extractedDescription = lines[i+1] ? lines[i+1].trim() : extractedDescription;
          } else if (line.includes('分析') || line.includes('analysis')) {
            extractedAnalysis = lines[i+1] ? lines[i+1].trim() : extractedAnalysis;
          } else if (line.includes('标签') || line.includes('tags')) {
            const tagLine = lines[i+1] ? lines[i+1] : '';
            const potentialTags = tagLine.split(/[,，、]/);
            if (potentialTags.length > 1) {
              extractedTags = potentialTags.map(tag => tag.trim()).filter(tag => tag);
            }
          }
        }
        
        parsedResponse = {
          title: extractedTitle,
          description: extractedDescription,
          tags: extractedTags,
          analysis: extractedAnalysis
        };
      }
    }
    
    // 确保字段格式规范并不会缺失
    const result = {
      title: parsedResponse.title || "图片分析（未识别物品）",
      description: parsedResponse.description || "系统未能提取有效描述",
      tags: Array.isArray(parsedResponse.tags) ? parsedResponse.tags : ["自动标签"],
      analysis: parsedResponse.analysis || "系统无法提供分析"
    };
    
    console.log("AI Assistant: 图片分析完成，结果:", result);
    
    return result;
  } catch (error) {
    console.error("图片分析出错:", error);
    return {
      error: error.message || "分析图片时发生错误",
      title: "无法分析图片",
      description: "很抱歉，无法分析您的图片。请稍后再试或联系客服。",
      tags: ["识别失败"],
      analysis: "分析失败：" + (error.message || "未知错误")
    };
  }
}

// /**
//  * 生成结构化的AI内容
//  * @param {object} options
//  * @param {import("zod").ZodSchema} options.outputSchema - Zod模式定义期望的输出结构
//  * @param {string} options.promptTemplateString - 提示词模板字符串, 必须包含 {format_instructions}
//  * @param {object} options.invokeContext - 传递给提示词的上下文变量
//  * @returns {Promise<object|{error: string}>} - AI生成的结构化对象或错误信息
//  */
// export const generateStructuredContent = async ({ outputSchema, promptTemplateString, invokeContext }) => {
//   try {
//     // 确保 outputSchema 是 Zod 类型，如果不是，需要调用者确保它兼容 fromZodSchema
//     // 例如: import { z } from "zod"; const schema = z.object({...});
//     const structuredParser = StructuredOutputParser.fromZodSchema(outputSchema);
//     const formatInstructions = structuredParser.getFormatInstructions();
    
//     const prompt = PromptTemplate.fromTemplate(promptTemplateString); // format_instructions 会被加入 invokeContext
    
//     const chain = prompt.pipe(model).pipe(structuredParser); // 使用主 model 实例

//     console.log(`AI Assistant (Structured): Invoking chain with context:`, {...invokeContext, format_instructions: formatInstructions});
//     const result = await chain.invoke({
//       ...invokeContext,
//       format_instructions: formatInstructions, // 确保 format_instructions 传递给模板
//     });
//     console.log(`AI Assistant (Structured): Received result:`, result);
//     return result;

//   } catch (error) {
//     console.error('AI structured content generation failed:', error);
//     if (error.message?.includes('Failed to parse') || error.message?.includes('OutputParserException')) {
//       return { error: `结构化内容生成失败：AI未能按预期格式返回内容。请检查Prompt或模型能力。 (${error.message})` };
//     }
//     return { error: `结构化内容生成失败: ${error.message}` };
//   }
// };

// // 辅助函数：根据内容类型获取基础提示模板字符串 (骨架)
// // 注意：此函数需要您根据 generateContent 的内部逻辑具体实现
// function getBasePromptForContentType(contentType, contextType, itemType = 'lost') {
//   // --- 失物招领场景 ---
//   if (contextType === 'lostfound') {
//     const typeText = itemType === 'lost' ? '寻物启事' : '招领启事';
//     const actionText = itemType === 'lost' ? '丢失' : '拾取';
//     switch (contentType) {
//       case 'title':
//         return `你是一个乐于助人的校园助手，正在帮助用户撰写${typeText}的标题。
//         请根据以下信息，生成一个简洁明了的${typeText}标题 (最多30字)，清楚说明${actionText}了什么物品，可包含地点或时间特征。
//         请务必参考用户的"生成提示"以满足其具体要求。

//         物品分类: {category}
//         ${actionText}地点: {location}
//         ${actionText}时间: {eventTime}
//         用户提示: {userPrompt}
//         现有描述: {description}

//         生成的${typeText}标题:`;
//       case 'description':
//         return `你是一个乐于助人的校园助手，正在帮助用户优化一份${typeText}。请根据用户提供的信息和要求，生成一段更清晰、信息更完整的${typeText}描述。
//         请务必重点参考用户在"生成提示"中给出的具体要求或侧重点。
//         **重要：请直接输出优化后的${typeText}文本，不要包含任何解释、前言或结尾。**

//         物品分类: {category}
//         ${actionText}地点: {location}
//         ${actionText}时间: {eventTime}
//         用户提示: {userPrompt}
//         现有描述: {description}

//         优化后的${typeText}描述:`;
//       case 'keywords':
//         return `你是一个帮助用户为${typeText}提取关键词的助手。
//         请根据以下信息，生成 3-5 个最相关的关键词，用逗号分隔，例如物品名称、关键特征、地点、分类等。
//         请参考用户的"生成提示"可能提到的侧重点。

//         物品分类: {category}
//         ${actionText}地点: {location}
//         ${actionText}时间: {eventTime}
//         用户提示: {userPrompt}
//         描述: {description}

//         生成的关键词:`;
//       default:
//         return "请为失物招领场景生成 {contentType}：用户提示是 {userPrompt}";
//     }
//   } else { // --- 商品场景 ---
//     switch (contentType) {
//       case 'title':
//         return `你是一个帮助用户为二手商品生成吸引人标题的助手。
//         请根据以下信息，生成一个简洁、有吸引力且包含关键信息的商品标题 (最多30字)。请参考用户的"生成提示"。

//         商品分类: {category}
//         用户提示: {userPrompt}
//         现有描述: {description}

//         生成的标题:`;
//       case 'description':
//         return `你是一个文本优化助手。请根据以下信息，生成一段更详细、更有吸引力、更流畅自然的商品描述。请保留关键信息，并适当润色。
//         请务必重点参考用户在"生成提示"中给出的具体要求或侧重点。
//         **重要：请直接输出优化后的描述文本，不要包含任何解释、前言或结尾。**

//         商品分类: {category}
//         商品标题: {title}
//         用户提示: {userPrompt}
//         现有描述: {description}

//         优化后的描述:`;
//       case 'tags':
//         return `你是一个帮助用户为二手商品生成相关标签的助手。
//         请根据以下信息，生成 3-5 个最相关的标签，用逗号分隔。请参考用户的"生成提示"。

//         商品分类: {category}
//         商品标题: {title}
//         用户提示: {userPrompt}
//         描述: {description}

//         生成的标签:`;
//       default:
//         return "请为商品场景生成 {contentType}：用户提示是 {userPrompt}";
//     }
//   }
// }


// /**
//  * 使用小样本示例来增强内容生成请求
//  * @param {object} originalOptions - 传递给原始 generateContent 的选项 ({ contentType, context })
//  * @param {Array<{input: object, output: string}>} examples - 小样本示例列表。每个示例的 input 对象应包含 examplePromptTemplateString 中的所有变量。
//  * @param {string} examplePromptTemplateString - 单个示例的格式化模板, e.g., "输入：{inputValue}\\n输出：{outputValue}"
//  * @param {string} [exampleOutputKey="output"] - example中表示期望输出的键名, 需要与examplePromptTemplateString中输出部分对应
//  * @returns {Promise<string|{error: string}>}
//  */
// export const enhanceWithFewShot = async (originalOptions, examples, examplePromptTemplateString, exampleOutputKey = "outputValue") => { // Adjusted exampleOutputKey to match a common pattern
//   const { contentType, context } = originalOptions;
  
//   try {
//     // 1. 获取对应场景的基础提示模板（不包含示例的部分）
//     // suffixPromptString 应该只包含原始任务的指令和输入变量占位符
//     const suffixPromptString = getBasePromptForContentType(contentType, context.contextType, context.itemType);
//     // 从 suffixPromptString 中提取 inputVariables (假设原始 prompt 也是 PromptTemplate)
//     // 这是一个简化处理，实际中可能需要更鲁棒的方式获取变量
//     const suffixInputVariables = (suffixPromptString.match(/\{([^}]+)\}/g) || []).map(v => v.slice(1, -1));


//     // 2. 创建 Example Selector
//     // 示例的 input 应该和 examplePromptTemplateString 的输入变量匹配
//     // 示例的 output 应该和 examplePromptTemplateString 中代表输出的部分匹配
//     const examplePrompt = PromptTemplate.fromTemplate(examplePromptTemplateString);
//     const exampleSelector = await LengthBasedExampleSelector.fromExamples(
//       examples.map(ex => {
//         const exampleWithOutputKey = { ...ex.input, [exampleOutputKey]: ex.output };
//         return exampleWithOutputKey;
//       }),
//       {
//         examplePrompt,
//         maxLength: 1800, // 根据LLM上下文长度调整, qwen-plus 通常支持8k tokens，这里保守一些
//       }
//     );
    
//     // 3. 创建 FewShotPromptTemplate
//     const fewShotPrompt = new FewShotPromptTemplate({
//       exampleSelector,
//       examplePrompt, // 用于格式化每个选定示例的模板
//       prefix: "以下是一些关于如何执行任务的优秀示例：", // 在示例之前的引导文本
//       suffix: suffixPromptString, // 原始的任务提示（不包含示例的部分）
//       inputVariables: suffixInputVariables, // 原始任务提示（suffix）所需的变量名
//       exampleSeparator: "\\n\\n---\\n\\n", // 示例之间的分隔符
//     });

//     // 4. 构建链并调用
//     const chain = fewShotPrompt.pipe(model).pipe(new StringOutputParser()); // 使用主model和StringOutputParser
    
//     console.log(`AI Assistant (FewShot): Invoking chain for ${contentType} (${context.contextType})...`);
//     // 传递给 invoke 的 context 应该是 suffixPromptString 所需的变量
//     const result = await chain.invoke(context); 
//     console.log(`AI Assistant (FewShot): Received result for ${contentType} (${context.contextType}):`, result);
//     return result;

//   } catch (error) {
//     console.error(`AI FewShot content generation failed for ${contentType} (${context.contextType}):`, error);
//     return { error: `小样本内容生成失败: ${error.message}` };
//   }
// };


// // 可以根据需要添加其他 AI 相关函数，例如图片分析 (需要不同的模型和处理)
// // export const analyzeImage = async (imageUrl) => { ... }

// // 注意：关于 embeddingModel 和 embeddingURL 的信息可以在此注释
// // Embedding Model Info (Not used in generateContent):
// // embeddingModel = "text-embedding-v3"
// // embeddingURL = "https://dashscope.aliyuncs.com/compatible-mode/v1" 
// // (For future use with RAG or similarity search)

// // 移除了不再需要的 getApiKeySecurely 示例函数 