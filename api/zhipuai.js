const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const API_TOKEN = 'adeaa36163c848749b91e5f9f8a3373c.6jurvrlT5pWxfzje';

// 发送API请求的通用函数
const sendRequest = async (data) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: API_URL,
      method: 'POST',
      data: {
        model: data.model,
        messages: data.messages,
        tools: data.tools,
        tool_choice: "auto",
        temperature: 0.7,
        top_p: 0.7,
        request_id: Date.now().toString(),
        do_sample: true,
        max_tokens: 1500
      },
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      success: (res) => {
        console.log('API响应:', res);
        resolve(res);
      },
      fail: (err) => {
        console.error('请求失败:', err);
        reject(err);
      }
    });
  });
};

/**
 * 发送查词请求
 * @param {string} word - 要查询的词语
 * @param {string} knowledgeBaseId - 知识库ID
 * @returns {Promise<Object>} - 返回结构化的词语信息
 */
const searchWord = async (word, knowledgeBaseId) => {
  const response = await sendRequest({
    model: 'glm-4',
    messages: [
      {
        role: 'system',
        content: `你是一个中文词典助手。请在知识库中查找词语"${word}"的解释，并按照以下格式返回词语的详细信息：
{
  "word": "${word}",
  "pinyin": "拼音",
  "basic_meaning": {
    "title": "基本意义",
    "content": "基本释义内容",
    "english": "英文翻译"
  },
  "core_usage": {
    "title": "核心用法",
    "patterns": [
      {
        "title": "用法类型",
        "structure": "语法结构",
        "features": ["特点1", "特点2"],
        "examples": ["例句1", "例句2"]
      }
    ]
  },
  "common_mistakes": {
    "title": "常见偏误纠正",
    "items": [
      {
        "type": "错误类型",
        "wrong": "错误用法",
        "correct": "正确用法"
      }
    ]
  }
}`
      },
      {
        role: 'user',
        content: word
      }
    ],
    tools: [{
      type: "retrieval",
      name: "knowledge_base_search",
      retrieval: {
        knowledge_id: knowledgeBaseId,
        prompt: "请在知识库中查找这个词语的解释。如果找到，请完全按照文档中的内容返回；如果未找到，请返回\"未找到相关内容\"。"
      }
    }]
  });

  if (!response.data?.choices?.[0]?.message?.content) {
    return null;
  }

  const content = response.data.choices[0].message.content.trim();
  console.log('API返回content:', content);

  if (content === "未找到相关内容") {
    return null;
  }

  try {
    // 清理并提取JSON内容
    let jsonStr = content;
    
    // 如果内容被包裹在代码块中，提取JSON部分
    if (content.includes('```')) {
      const matches = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (matches && matches[1]) {
        jsonStr = matches[1].trim();
      }
    }
    
    // 解析JSON
    const result = JSON.parse(jsonStr);
    
    // 验证并返回数据
    if (result && typeof result === 'object') {
      return {
        word: result.word || word,
        pinyin: result.pinyin || '',
        basic_meaning: {
          title: result.basic_meaning?.title || '基本意义',
          content: result.basic_meaning?.content || '',
          english: result.basic_meaning?.english || ''
        },
        core_usage: {
          title: result.core_usage?.title || '核心用法',
          patterns: Array.isArray(result.core_usage?.patterns) ? result.core_usage.patterns : []
        },
        common_mistakes: {
          title: result.common_mistakes?.title || '常见偏误纠正',
          items: Array.isArray(result.common_mistakes?.items) ? result.common_mistakes.items : []
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('解析JSON失败:', error, '\n原始内容:', content);
    return null;
  }
};

export default {
  searchWord
}; 