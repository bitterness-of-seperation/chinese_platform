'use strict';
const db = uniCloud.database();
const chatHistoryCollection = db.collection('chat_history');
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { user_id, chat_id, message, mode = 'normal' } = event;
  
  if (!user_id || !message) {
    return {
      code: 400,
      message: '缺少必要参数'
    };
  }
  
  const now = Date.now();
  
  try {
    // 构建消息对象
    const messageObj = {
      role: 'user',
      content: message,
      timestamp: now,
      mode: mode
    };
    
    if (chat_id) {
      // 更新现有聊天记录
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
      
      // 添加新消息
      await chatHistoryCollection.doc(chat_id).update({
        chat_records: dbCmd.push(messageObj),
        last_message_time: now,
        update_date: now
      });
      
      return {
        code: 200,
        data: {
          chat_id: chat_id,
          message: messageObj
        },
        message: '保存消息成功'
      };
    } else {
      // 创建新的聊天记录
      const title = message.length > 20 ? message.substring(0, 20) + '...' : message;
      
      const result = await chatHistoryCollection.add({
        user_id: user_id,
        chat_records: [messageObj],
        title: title,
        last_message_time: now,
        create_date: now,
        update_date: now
      });
      
      return {
        code: 200,
        data: {
          chat_id: result.id,
          message: messageObj
        },
        message: '创建聊天记录成功'
      };
    }
  } catch (error) {
    console.error('保存聊天消息失败:', error);
    return {
      code: 500,
      message: '保存聊天消息失败: ' + error.message
    };
  }
}; 