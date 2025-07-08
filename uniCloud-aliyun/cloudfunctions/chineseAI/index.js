'use strict';

const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const API_TOKEN = 'adeaa36163c848749b91e5f9f8a3373c.6jurvrlT5pWxfzje';

// 重试函数
async function retryRequest(fn, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`尝试请求AI接口，第 ${i + 1} 次`);
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`第 ${i + 1} 次尝试失败:`, error);
      
      // 如果不是最后一次尝试，等待一段时间后重试
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1))); // 递增等待时间
      }
    }
  }
  
  throw lastError;
}

exports.main = async (event, context) => {
  const { prompt } = event;
  
  if (!prompt) {
    return {
      success: false,
      message: '缺少必要参数prompt'
    };
  }
  
  try {
    const makeRequest = async () => {
      const response = await uniCloud.httpclient.request(API_URL, {
        method: 'POST',
        data: {
          model: 'glm-4',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的中文教学助手，擅长回答中文学习相关的问题。请用简单易懂的语言回答问题，避免使用过于专业的术语。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5, // 降低温度以提高一致性
          top_p: 0.8,
          request_id: Date.now().toString(),
          do_sample: true,
          max_tokens: 800 // 减少token数量以加快响应
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`
        },
        dataType: 'json',
        timeout: 90000, // 设置为90秒
        rejectUnauthorized: false,
        keepAlive: true,
        timing: true
      });
      
      console.log('请求耗时:', response.timing);
      
      if (response.status !== 200) {
        throw new Error(`API请求失败: ${response.status}, 响应内容: ${JSON.stringify(response.data)}`);
      }
      
      if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
        throw new Error(`API返回数据格式错误: ${JSON.stringify(response.data)}`);
      }
      
      return response;
    };
    
    // 使用重试机制
    const response = await retryRequest(makeRequest);
    
    console.log('API响应:', JSON.stringify(response.data, null, 2));
    
    return {
      success: true,
      result: response.data.choices[0].message.content
    };
    
  } catch (error) {
    console.error('处理请求失败:', error);
    
    // 返回一个友好的错误消息
    return {
      success: false,
      message: '抱歉，我现在有点忙，请稍后再试。',
      error: error.message
    };
  }
}; 