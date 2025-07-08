'use strict';
const crypto = require('crypto');

function encryptPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

exports.main = async (event, context) => {
  const { username, password, nickname } = event;
  const db = uniCloud.database();
  
  try {
    // 检查用户名是否已存在
    const userCollection = db.collection('uni-id-users');
    const existingUser = await userCollection.where({
      username: username
    }).get();
    
    if (existingUser.data.length > 0) {
      return {
        code: 400,
        msg: '用户名已存在'
      };
    }
    
    // 创建新用户
    const hashedPassword = encryptPassword(password);
    const userInfo = {
      username,
      password: hashedPassword,
      nickname: nickname || username,
      avatar: '/static/default-avatar.png',
      learned_words: 0,
      streak_days: 0,
      points: 0,
      register_date: Date.now()
    };
    
    const result = await userCollection.add(userInfo);
    
    if (result.id) {
      return {
        code: 200,
        msg: '注册成功',
        data: {
          username,
          nickname: userInfo.nickname
        }
      };
    } else {
      return {
        code: 500,
        msg: '注册失败，请稍后重试'
      };
    }
    
  } catch (error) {
    console.error('注册错误：', error);
    return {
      code: 500,
      msg: '注册失败：' + error.message
    };
  }
}; 