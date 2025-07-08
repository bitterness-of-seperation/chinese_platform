const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const API_TOKEN = 'adeaa36163c848749b91e5f9f8a3373c.6jurvrlT5pWxfzje';

// 发送API请求的通用函数
const sendRequest = async (data) => {
  return new Promise((resolve, reject) => {
    uni.request({
      url: API_URL,
      method: 'POST',
      data: {
        model: data.model || 'glm-4',
        messages: data.messages,
        tools: data.tools,
        tool_choice: "auto",
        temperature: data.temperature || 0.7,
        top_p: data.top_p || 0.7,
        request_id: Date.now().toString(),
        do_sample: true,
        max_tokens: data.max_tokens || 1500
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
 * 发送中文学习相关问题（普通模式）
 * @param {string} question - 用户的问题
 * @param {Array} history - 聊天历史记录
 * @returns {Promise<Object>} - 返回AI回答
 */
const askChineseQuestion = async (question, history = []) => {
  // 构建消息历史
  const messages = [
    {
      role: 'system',
      content: `你是一位友好的中文学习助手，名叫"语文通"。你的目标是以简单易懂的方式帮助用户学习中文。
      
请遵循以下原则：
1. 使用简单、清晰的语言解释概念
2. 提供实用的例句和用法说明
3. 避免使用过于专业的语言学术语
4. 回答要简洁明了，适合初中级中文学习者理解
5. 如果用户提出的问题不清楚，友好地请求澄清
6. 对于汉字，提供拼音和基本含义
7. 对于语法点，用简单的例子解释用法`
    },
    ...history,
    {
      role: 'user',
      content: question
    }
  ];

  const response = await sendRequest({
    model: 'glm-4',
    messages: messages
  });

  if (!response.data?.choices?.[0]?.message?.content) {
    return {
      success: false,
      message: '获取回答失败',
      content: null
    };
  }

  const content = response.data.choices[0].message.content.trim();
  
  return {
    success: true,
    message: '获取回答成功',
    content: content
  };
};

/**
 * 发送中文学习相关问题（专业模式）
 * @param {string} question - 用户的问题
 * @param {Array} history - 聊天历史记录
 * @returns {Promise<Object>} - 返回AI回答
 */
const askChineseQuestionProfessional = async (question, history = []) => {
  // 构建消息历史
  const messages = [
    {
      role: 'system',
      content: `你是一位专业的中文语言学专家，名叫"语文博士"。你的目标是提供深入、专业的中文语言学知识。
      
请遵循以下原则：
1. 提供学术性的、详细的语言学解释
2. 使用专业的语言学术语，并解释这些术语
3. 引用相关的语言学理论和研究成果
4. 对汉字提供详细的字源学和语义分析
5. 对语法点进行深入的句法和语用分析
6. 区分不同方言和语体中的用法差异
7. 提供系统性的知识框架，帮助用户建立完整的语言学理解
8. 可以使用适当的图表和分类方式组织信息`
    },
    ...history,
    {
      role: 'user',
      content: question
    }
  ];

  const response = await sendRequest({
    model: 'glm-4',
    messages: messages,
    temperature: 0.5, // 更低的温度，回答更精确
    max_tokens: 2000 // 允许更长的回答
  });

  if (!response.data?.choices?.[0]?.message?.content) {
    return {
      success: false,
      message: '获取回答失败',
      content: null
    };
  }

  const content = response.data.choices[0].message.content.trim();
  
  return {
    success: true,
    message: '获取回答成功',
    content: content
  };
};

/**
 * 生成单个词语的学习数据
 * @param {string} word - 要生成数据的词语
 * @param {string} userId - 用户ID
 * @param {string} bookId - 词书ID
 * @returns {Promise<Object>} - 返回结构化的词语信息
 */
const generateWordData = async (word, userId = '', bookId = '') => {
  // 获取用户已学习的单词
  let learnedWords = [];
  let learnedWordsPrompt = '';
  
  if (userId && bookId) {
    try {
      const { result } = await uniCloud.callFunction({
        name: 'getWordbookProgress',
        data: {
          user_id: userId,
          book_id: bookId
        }
      });

      if (result.code === 200 && result.data.learned_words) {
        learnedWords = result.data.learned_words;
        learnedWordsPrompt = learnedWords.length > 0
          ? `请注意：用户已经学习过以下单词，请不要在生成的内容中包含这些单词：${learnedWords.join(', ')}。`
          : '';
      }
    } catch (error) {
      console.error('获取已学习单词失败:', error);
    }
  }
  
  const response = await sendRequest({
    model: 'glm-4',
    messages: [
      {
        role: 'system',
        content: `你是一个中文教学专家。请为词语"${word}"生成学习数据，包括拼音、词性、定义、语法信息和例句。${learnedWordsPrompt}请按照以下JSON格式返回：
{
  "word": "${word}",
  "pinyin": "拼音",
  "type": "词性",
  "definitions": ["主要定义", "其他定义"],
  "grammar": {
    "title": "语法重点",
    "pattern": "语法结构",
    "notes": "用法提示",
    "level": "难度级别"
  },
  "examples": [
    {
      "text": "例句原文",
      "pinyin": "例句拼音",
      "translation": "英文翻译"
    }
  ],
  "phrases": [
    {
      "chinese": "相关词组",
      "pinyin": "词组拼音",
      "english": "词组英文"
    }
  ]
}`
      },
      {
        role: 'user',
        content: `请生成"${word}"的学习数据`
      }
    ]
  });

  if (!response.data?.choices?.[0]?.message?.content) {
    return null;
  }

  const content = response.data.choices[0].message.content.trim();
  console.log('API返回content:', content);

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
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('解析JSON失败:', error, '\n原始内容:', content);
    return null;
  }
};

/**
 * 批量生成词语的学习数据
 * @param {Array<string>} words - 要生成数据的词语数组（可为空，将由AI生成）
 * @param {string} bookType - 词书类型
 * @param {string} userId - 用户ID
 * @param {string} bookId - 词书ID
 * @returns {Promise<Array<Object>>} - 返回结构化的词语信息数组
 */
const generateBatchWordData = async (words = [], bookType = 'HSK3', userId = '', bookId = '') => {
  try {
    console.log(`正在为${bookType}词书生成学习数据`);
    
    // 获取用户已学习的单词
    let learnedWords = [];
    let learnedWordsPrompt = '';
    
    if (userId && bookId) {
      try {
        const { result } = await uniCloud.callFunction({
          name: 'getWordbookProgress',
          data: {
            user_id: userId,
            book_id: bookId
          }
        });

        if (result.code === 200 && result.data.learned_words) {
          learnedWords = result.data.learned_words;
          learnedWordsPrompt = learnedWords.length > 0
            ? `请注意：用户已经学习过以下单词，请不要在生成的内容中包含这些单词：${learnedWords.join(', ')}。`
            : '';
        }
      } catch (error) {
        console.error('获取已学习单词失败:', error);
      }
    }
    
    const response = await sendRequest({
      model: 'glm-4',
      messages: [
        {
          role: 'system',
          content: `你是一个中文教学专家。请从${bookType}词书中选择5个重要词语生成学习数据，包括拼音、词性、定义和例句。${learnedWordsPrompt}

请按照以下JSON格式返回一个数组：
[
  {
    "word": "词语",
    "pinyin": "拼音",
    "type": "词性",
    "definitions": ["主要定义", "其他定义"],
    "answer_options": [
      {"text": "正确的词义", "isCorrect": true},
      {"text": "错误选项1", "isCorrect": false},
      {"text": "错误选项2", "isCorrect": false},
      {"text": "错误选项3", "isCorrect": false}
    ],
    "grammar": {
      "title": "语法重点",
      "pattern": "语法结构",
      "notes": "用法提示",
      "level": "难度级别"
    },
    "examples": [
      {
        "text": "例句原文",
        "pinyin": "例句拼音",
        "translation": "英文翻译"
      }
    ],
    "phrases": [
      {
        "chinese": "相关词组",
        "pinyin": "词组拼音",
        "english": "词组英文"
      }
    ]
  }
]

注意：
1. 必须提供4个答案选项，其中只有1个是正确的
2. 答案选项应该有一定的干扰性，难度适中
3. 确保返回的是有效的JSON格式
4. 不要生成用户已学习过的单词`
        },
        {
          role: 'user',
          content: words.length > 0 
            ? `请为这些词语生成学习数据：${words.join(', ')}` 
            : `请生成${bookType}词书中的5个新词语的学习数据`
        }
      ]
    });

    if (!response.data?.choices?.[0]?.message?.content) {
      console.error('API返回数据为空');
      return fallbackWordData(words.length > 0 ? words : ['把', '被', '让', '从', '给']);
    }

    const content = response.data.choices[0].message.content.trim();
    console.log('API返回batch content:', content);

    try {
      // 使用辅助函数解析JSON
      const result = parseJSON(content);
      
      if (result && result.length > 0) {
        // 确保每个词都有必要的字段
        const validatedResult = result.map(item => validateWordData(item));
        return validatedResult;
      }
      
      console.error('无法解析有效的词汇数据');
      return fallbackWordData(words.length > 0 ? words : ['把', '被', '让', '从', '给']);
    } catch (error) {
      console.error('解析JSON失败:', error, '\n原始内容:', content);
      return fallbackWordData(words.length > 0 ? words : ['把', '被', '让', '从', '给']);
    }
  } catch (error) {
    console.error('生成批量词汇数据失败:', error);
    return fallbackWordData(words.length > 0 ? words : ['把', '被', '让', '从', '给']);
  }
};

/**
 * 验证并补全单词数据，确保所有必要字段都存在
 * @param {Object} wordData - 单词数据对象
 * @returns {Object} - 补全后的单词数据对象
 */
const validateWordData = (wordData) => {
  if (!wordData) return null;
  
  // 确保有答案选项，如果没有则生成
  let answerOptions = wordData.answer_options || [];
  if (!Array.isArray(answerOptions) || answerOptions.length < 4) {
    const correctOption = {
      text: wordData.definitions && wordData.definitions.length > 0 ? wordData.definitions[0] : '默认定义',
      isCorrect: true
    };
    
    answerOptions = [
      correctOption,
      { text: '用于表示时间的词语', isCorrect: false },
      { text: '用于表示地点的词语', isCorrect: false },
      { text: '用于表示方式的词语', isCorrect: false }
    ];
  }
  
  return {
    word: wordData.word || '未知词语',
    pinyin: wordData.pinyin || '',
    type: wordData.type || '未知词性',
    definitions: Array.isArray(wordData.definitions) ? wordData.definitions : ['无定义'],
    answer_options: answerOptions,
    grammar: {
      title: wordData.grammar?.title || '语法说明',
      pattern: wordData.grammar?.pattern || '',
      notes: wordData.grammar?.notes || '',
      level: wordData.grammar?.level || 'HSK3'
    },
    examples: Array.isArray(wordData.examples) ? wordData.examples.map(example => ({
      text: example.text || '',
      pinyin: example.pinyin || '',
      translation: example.translation || ''
    })) : [],
    phrases: Array.isArray(wordData.phrases) ? wordData.phrases.map(phrase => ({
      chinese: phrase.chinese || '',
      pinyin: phrase.pinyin || '',
      english: phrase.english || ''
    })) : []
  };
};

/**
 * 当API调用失败时提供备用数据
 * @param {Array<string>} words - 词语列表
 * @returns {Array<Object>} - 生成的备用词语数据
 */
const fallbackWordData = (words) => {
  return words.map(word => ({
    word,
    pinyin: 'pīn yīn',
    type: '词性',
    definitions: ['默认释义'],
    answer_options: [
      { text: '默认释义', isCorrect: true },
      { text: '用于表示时间的词语', isCorrect: false },
      { text: '用于表示地点的词语', isCorrect: false },
      { text: '用于表示方式的词语', isCorrect: false }
    ],
    grammar: {
      title: '语法说明',
      pattern: '语法结构',
      notes: '用法说明',
      level: 'HSK3'
    },
    examples: [{
      text: `这是使用"${word}"的例句。`,
      pinyin: 'zhè shì shǐ yòng de lì jù',
      translation: `This is an example using "${word}".`
    }],
    phrases: [{
      chinese: `${word}短语`,
      pinyin: 'duǎn yǔ',
      english: 'phrase'
    }]
  }));
};

// 提取JSON内容的辅助函数
const extractJSONFromContent = (content) => {
  try {
    // 如果内容中包含代码块，尝试提取JSON部分
    if (content.includes('```json')) {
      const matches = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (matches && matches[1]) {
        return matches[1].trim();
      }
    }
    
    // 尝试直接匹配JSON数组
    const arrayMatch = content.match(/\[\s*{[\s\S]*}\s*\]/);
    if (arrayMatch) {
      return arrayMatch[0];
    }
    
    // 尝试匹配每个JSON对象
    const objectsMatch = content.match(/\{\s*"word"[\s\S]*?\}\s*(?=,|$)/g);
    if (objectsMatch && objectsMatch.length > 0) {
      return `[${objectsMatch.join(',')}]`;
    }
    
    throw new Error('无法提取有效的JSON数据');
  } catch (error) {
    console.error('提取JSON失败:', error);
    return null;
  }
};

// 清理并提取JSON内容
const parseJSON = (content) => {
  try {
    // 清理并提取JSON内容
    let jsonStr = extractJSONFromContent(content);
    if (!jsonStr) {
      throw new Error('无法提取JSON内容');
    }
    
    // 解析JSON
    const result = JSON.parse(jsonStr);
    
    // 验证并返回数据
    if (Array.isArray(result)) {
      return result;
    } else if (result && typeof result === 'object') {
      return [result];
    }
    
    throw new Error('解析结果不是有效的数组或对象');
  } catch (error) {
    console.error('解析JSON失败:', error, '\n原始内容:', content);
    return null;
  }
};

// 导出函数
export {
  askChineseQuestion,
  askChineseQuestionProfessional,
  generateWordData,
  generateBatchWordData
} 