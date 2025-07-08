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
        temperature: 0.7,
        top_p: 0.7,
        request_id: Date.now().toString(),
        do_sample: true,
        max_tokens: 1000,
        stream: false
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
 * 生成中文学习AI助手的回答 - 基础模式（平易回答）
 * @param {string} question - 用户提问内容
 * @returns {Promise<Object>} - 返回AI回答
 */
const getSimpleResponse = async (question) => {
  const response = await sendRequest({
    model: 'glm-4',
    messages: [
      {
        role: 'system',
        content: `你是一个专注于中文学习的AI助手，名为"汉语助教"。
你的目标是以平易近人的方式帮助非母语用户学习中文。

回答要求：
1. 使用简单易懂的语言，避免使用复杂的语言学术语
2. 回答要简洁，不超过200字
3. 针对语法问题，提供1-2个简单例句
4. 对于词汇问题，只提供最常用的1-2个意思
5. 语气亲切友好，像一个耐心的初级教师
6. 如果遇到不确定的问题，主动表示不确定并给出替代建议`
      },
      {
        role: 'user',
        content: question
      }
    ]
  });

  if (!response.data?.choices?.[0]?.message?.content) {
    return {
      success: false,
      message: "无法获取回答"
    };
  }

  const content = response.data.choices[0].message.content.trim();
  
  return {
    success: true,
    content: content,
    mode: 'normal'
  };
};

/**
 * 生成中文学习AI助手的回答 - 专业模式（详细解答）
 * @param {string} question - 用户提问内容
 * @returns {Promise<Object>} - 返回AI回答
 */
const getProfessionalResponse = async (question) => {
  const response = await sendRequest({
    model: 'glm-4',
    messages: [
      {
        role: 'system',
        content: `你是一个专业的中文教学专家，名为"汉语专家"。
你拥有丰富的对外汉语教学经验和语言学知识。

回答要求：
1. 提供学术准确、系统化的解答
2. 使用恰当的语言学术语解释语法现象
3. 回答可以详细，但需要层次分明，使用小标题或数字编号组织内容
4. 针对语法问题，分析句法结构，提供3-5个例句展示用法变化
5. 对于词汇问题，详细解释词源、用法区别、搭配习惯等
6. 引用相关的语言学理论或研究成果（如适用）
7. 针对常见错误提供纠正和避免建议
8. 语气专业客观，像一位语言学教授`
      },
      {
        role: 'user',
        content: question
      }
    ]
  });

  if (!response.data?.choices?.[0]?.message?.content) {
    return {
      success: false,
      message: "无法获取回答"
    };
  }

  const content = response.data.choices[0].message.content.trim();
  
  return {
    success: true,
    content: content,
    mode: 'professional'
  };
};

export default {
  getSimpleResponse,
  getProfessionalResponse
}; 