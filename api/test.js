const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const API_TOKEN = 'adeaa36163c848749b91e5f9f8a3373c.6jurvrlT5pWxfzje';

// 发送API请求的通用函数
const sendRequest = async (data) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({
        model: data.model,
        messages: data.messages,
        tools: data.tools,
        tool_choice: "auto",
        temperature: 0.7,
        top_p: 0.7,
        request_id: Date.now().toString(),
        do_sample: true,
        max_tokens: 1500
      })
    });

    const result = await response.json();
    console.log('API响应:', result);
    return result;
  } catch (error) {
    console.error('请求失败:', error);
    throw error;
  }
};

const test = async () => {
    const word = '来不及';
    const knowledgeBaseId = '1934900239169458176';
    console.log('开始测试搜索词语:', word);
    
    const response = await sendRequest({
      model: 'glm-4',
      messages: [
        {
          role: 'user',
          content: `查找词语"${word}"的解释"。`
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

    console.log('完整响应:', JSON.stringify(response, null, 2));

    if (!response.choices?.[0]?.message?.content) {
      console.log('未获取到内容');
      return null;
    }

    const content = response.choices[0].message.content.trim();
    console.log('API返回content:', content);

    if (content === "未找到相关内容") {
      console.log('未找到相关内容');
      return null;
    }
  }

// 运行测试
test(); 