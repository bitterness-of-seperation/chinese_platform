'use strict';
const db = uniCloud.database();
const chatHistoryCollection = db.collection('chat_history');
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { user_id, chat_id, response, mode = 'normal' } = event;
  
  if (!user_id || !chat_id || !response) {
    return {
      code: 400,
      message: '缺少必要参数'
    };
  }
  
  const now = Date.now();
  
  try {
    // 构建回复消息对象
    const responseObj = {
      role: 'assistant',
      content: response,
      timestamp: now,
      mode: mode
    };
    
    // 获取聊天记录
    const { data } = await chatHistoryCollection.doc(chat_id).get();
    
    if (data.length === 0) {
      return {
        code: 404,
        message: '未找到聊天记录'
      };
    }
    
    // 验证用户权限
    if (data[0].user_id !== user_id) {
      return {
        code: 403,
        message: '无权访问该聊天记录'
      };
    }
    
    // 添加AI回复
    await chatHistoryCollection.doc(chat_id).update({
      chat_records: dbCmd.push(responseObj),
      last_message_time: now,
      update_date: now
    });
    
    return {
      code: 200,
      data: {
        chat_id: chat_id,
        response: responseObj
      },
      message: '保存AI回复成功'
    };
  } catch (error) {
    console.error('保存AI回复失败:', error);
    return {
      code: 500,
      message: '保存AI回复失败: ' + error.message
    };
  }
}; 