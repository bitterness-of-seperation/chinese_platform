'use strict';
const db = uniCloud.database();
const chatHistoryCollection = db.collection('chat_history');

exports.main = async (event, context) => {
  const { user_id, chat_id } = event;
  
  if (!user_id) {
    return {
      code: 400,
      message: '缺少必要参数'
    };
  }
  
  try {
    if (chat_id) {
      // 获取指定聊天记录
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
      
      return {
        code: 200,
        data: data[0],
        message: '获取聊天记录成功'
      };
    } else {
      // 获取用户所有聊天记录的摘要
      const { data } = await chatHistoryCollection
        .where({
          user_id: user_id
        })
        .field({
          _id: 1,
          title: 1,
          last_message_time: 1,
          create_date: 1
        })
        .orderBy('last_message_time', 'desc')
        .get();
      
      return {
        code: 200,
        data: data,
        message: '获取聊天记录列表成功'
      };
    }
  } catch (error) {
    console.error('获取聊天记录失败:', error);
    return {
      code: 500,
      message: '获取聊天记录失败: ' + error.message
    };
  }
}; 