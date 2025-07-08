'use strict';
const uniID = require('uni-id-common');
const db = uniCloud.database();
const crypto = require('crypto');

// 验证密码的函数
function verifyPassword(password, hash, salt) {
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return verifyHash === hash;
}

function encryptPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 执行签到操作
async function doSignAttendance(userId) {
  try {
    const attendanceCollection = db.collection('attendance');
    
    // 检查今天是否已签到
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 将日期转换为ISOString格式的日期部分，便于比较
    const todayStr = today.toISOString().split('T')[0];
    
    const existingRecord = await attendanceCollection
      .where({
        user_id: userId
      })
      .get();
    
    // 过滤出今天的记录
    const todayRecords = existingRecord.data.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.toISOString().split('T')[0] === todayStr;
    });
    
    // 如果今天已经签到，则不重复签到
    if (todayRecords && todayRecords.length > 0) {
      console.log('用户今日已签到');
      return {
        is_signed: true,
        continuous_days: todayRecords[0].continuous_days,
        message: '今日已签到'
      };
    }
    
    // 获取昨天的签到记录，计算连续签到天数
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // 过滤出昨天的记录
    const yesterdayRecords = existingRecord.data.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.toISOString().split('T')[0] === yesterdayStr;
    });
    
    let continuousDays = 1; // 默认为1天
    
    // 如果昨天有签到，则连续天数+1
    if (yesterdayRecords && yesterdayRecords.length > 0) {
      continuousDays = yesterdayRecords[0].continuous_days + 1;
    }
    
    // 创建新的签到记录
    const newRecord = {
      user_id: userId,
      date: today,
      continuous_days: continuousDays,
      create_date: new Date()
    };
    
    await attendanceCollection.add(newRecord);
    
    console.log(`用户签到成功，连续签到${continuousDays}天`);
    return {
      is_signed: true,
      continuous_days: continuousDays,
      message: '签到成功',
      record: newRecord
    };
    
  } catch (error) {
    console.error('签到操作失败:', error);
    return {
      is_signed: false,
      message: '签到失败'
    };
  }
}

exports.main = async (event, context) => {
  console.log('登录函数开始执行，接收到的参数：', event);
  
  const { username, password } = event;
  const clientInfo = event.clientInfo || {};
  
  // 参数校验
  if (!username || !password) {
    console.log('参数校验失败：用户名或密码为空');
    return {
      code: 401,
      msg: '用户名和密码不能为空'
    }
  }
  
  try {
    console.log('开始验证登录');
    const uniIDIns = uniID.createInstance({
      context
    });
    
    // 查找用户
    const userCollection = db.collection('uni-id-users');
    const userResult = await userCollection.where({
      username: username
    }).get();
    
    if (userResult.data.length === 0) {
      return {
        code: 401,
        msg: '用户名或密码错误'
      };
    }
    
    const user = userResult.data[0];
    const hashedPassword = encryptPassword(password);
    
    if (hashedPassword !== user.password) {
      return {
        code: 401,
        msg: '用户名或密码错误'
      };
    }
    
    // 检查用户状态
    if (user.status === 1) {
      return {
        code: 403,
        msg: '账号已被禁用'
      }
    }
    
    if (user.ban_status === 1) {
      if (user.ban_expiry_time && new Date(user.ban_expiry_time) <= new Date()) {
        // 封禁已过期，自动解除
        await userCollection.doc(user._id).update({
          ban_status: 0,
          ban_expiry_time: null,
          updated_at: new Date().toISOString()
        });
      } else {
        return {
          code: 403,
          msg: '账号已被封禁'
        }
      }
    }
    
    // 生成token
    const token = `token_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    const tokenExpired = Date.now() + 24 * 60 * 60 * 1000; // 24小时后过期
    
    // 更新最后登录时间
    await userCollection.doc(user._id).update({
      last_login_date: new Date(),
      last_login_ip: clientInfo.ip || '',
      updated_at: new Date().toISOString()
    });
    
    // 登录成功后自动执行签到
    const signResult = await doSignAttendance(user._id);
    
    // 返回用户信息，不包含密码
    const userInfo = { ...user };
    delete userInfo.password;
    
    return {
      code: 200,
      msg: `登录成功${signResult.is_signed ? '，已自动签到' : ''}`,
      data: {
        token,
        tokenExpired,
        userInfo,
        attendance: signResult
      }
    };
    
  } catch (error) {
    console.error('登录错误：', error);
    return {
      code: 500,
      msg: '登录失败：' + error.message
    };
  }
}; 