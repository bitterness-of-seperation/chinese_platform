'use strict';
const uniID = require('uni-id-common');

exports.main = async (event, context) => {
  console.log('验证token，接收到的参数：', event);
  
  try {
    const { token } = event;
    
    if (!token) {
      return {
        code: 401,
        msg: 'token不能为空'
      };
    }
    
    const uniIDIns = uniID.createInstance({ context });
    const checkTokenRes = await uniIDIns.checkToken(token);
    
    if (checkTokenRes.code) {
      return {
        code: 401,
        msg: 'token无效'
      };
    }
    
    return {
      code: 200,
      msg: 'token有效',
      data: checkTokenRes
    };
  } catch (error) {
    console.error('验证token时发生错误：', error);
    return {
      code: 500,
      msg: '验证token失败：' + error.message
    };
  }
}; 