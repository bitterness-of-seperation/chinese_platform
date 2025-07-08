'use strict';

const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const API_TOKEN = 'adeaa36163c848749b91e5f9f8a3373c.6jurvrlT5pWxfzje';

exports.main = async (event, context) => {
  const { wordId } = event;
  
  if (!wordId) {
    return {
      success: false,
      message: '缺少必要参数wordId'
    };
  }
  
  try {
    // 从数据库获取词语信息
    const db = uniCloud.database();
    const result = await db.collection('words')
      .where({
        _id: wordId
      })
      .get();
      
    if (!result.data || result.data.length === 0) {
      throw new Error('未找到对应的词语');
    }
    
    const word = result.data[0];
    
    // 检查必要字段
    if (!word.word || !word.translation || !word.level || !word.pinyin) {
      throw new Error('词语数据不完整');
    }
    
    const { word: wordText, translation, level, pinyin } = word;

    // 优化提示词，减少token数量
    const prompt = `为HSK${level}级词语"${wordText}"(${pinyin}, ${translation})创建情景练习题。

要求：
1. 创建对话场景
2. 包含目标词的句子
3. 提供4个选项（1正确，3干扰）
4. JSON格式：
   {
     "word": "${wordText}",
     "sentence": "句子",
     "blank_sentence": "带___的句子",
     "translation": "英文翻译",
     "options": [
       {"text": "选项1", "is_correct": true, "explanation": "解释"},
       {"text": "选项2", "is_correct": false, "explanation": "解释"},
       {"text": "选项3", "is_correct": false, "explanation": "解释"},
       {"text": "选项4", "is_correct": false, "explanation": "解释"}
     ],
     "hint": "提示",
     "context": "场景描述",
     "level": ${level}
   }

直接返回JSON，不要其他文字。`;

    // 调用AI接口
    const response = await uniCloud.httpclient.request(API_URL, {
      method: 'POST',
      data: {
        model: 'glm-4',
        messages: [
          {
            role: 'system',
            content: '你是中文教学助手，创建情景对话练习题。严格按要求生成练习题，确保返回有效JSON格式。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        top_p: 0.7,
        request_id: Date.now().toString(),
        do_sample: true,
        max_tokens: 600 // 减少token数量以加快响应
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      dataType: 'json',
      timeout: 60000, // 减少到60秒
      rejectUnauthorized: false,
      keepAlive: true
    });
    
    if (response.status !== 200) {
      console.error('API请求失败:', response.status, response.data);
      // 返回一个默认的练习题
      return {
        success: true,
        exercise: {
          word: word.word,
          word_id: wordId,
          sentence: `这是一个使用"${word.word}"的句子。`,
          blank_sentence: `这是一个使用"___"的句子。`,
          translation: "This is a sentence using the word.",
          options: [
            { text: word.word, is_correct: true, explanation: "这是正确答案。" },
            { text: "选项2", is_correct: false, explanation: "这是错误选项。" },
            { text: "选项3", is_correct: false, explanation: "这是错误选项。" },
            { text: "选项4", is_correct: false, explanation: "这是错误选项。" }
          ],
          hint: `如何使用"${word.word}"`,
          context: "一个简单的对话场景",
          level: word.level,
          original_word: word.word,
          original_pinyin: word.pinyin,
          original_meaning: word.translation
        }
      };
    }
    
    if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
      throw new Error(`API返回数据格式错误: ${JSON.stringify(response.data)}`);
    }
    
    // 解析AI返回的JSON
    let exercise;
    try {
      const content = response.data.choices[0].message.content.trim();
      
      // 尝试直接解析
      try {
        exercise = JSON.parse(content);
      } catch (e) {
        // 如果直接解析失败，尝试提取JSON部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          exercise = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('无法找到有效的JSON数据');
        }
      }
    } catch (error) {
      throw new Error(`解析AI返回数据失败: ${error.message}`);
    }
    
    // 验证练习题格式
    const requiredFields = [
      'word',
      'sentence',
      'blank_sentence',
      'translation',
      'options',
      'hint',
      'context',
      'level'
    ];
    
    // 检查必需字段
    for (const field of requiredFields) {
      if (!exercise[field]) {
        throw new Error(`练习题缺少必要字段: ${field}`);
      }
    }
    
    // 检查选项
    if (!Array.isArray(exercise.options) || exercise.options.length !== 4) {
      throw new Error('选项数量必须为4个');
    }
    
    // 检查每个选项的格式
    const hasValidOptions = exercise.options.every(option => 
      option.text && 
      typeof option.is_correct === 'boolean' && 
      option.explanation
    );
    
    if (!hasValidOptions) {
      throw new Error('选项格式不正确');
    }
    
    // 确保只有一个正确答案
    const correctCount = exercise.options.filter(opt => opt.is_correct).length;
    if (correctCount !== 1) {
      throw new Error('必须有且仅有一个正确答案');
    }
    
    // 返回结果时包含更多原始数据
    return {
      success: true,
      exercise: {
        ...exercise,
        word_id: wordId,
        original_word: wordText,
        original_pinyin: pinyin,
        original_meaning: translation
      }
    };
    
  } catch (error) {
    console.error('生成情景练习失败:', error);
    return {
      success: false,
      message: error.message || '生成练习题失败',
      error: error.stack
    };
  }
}; 