/**
 * Docker 健康检查脚本
 * 检查应用是否正常运行
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  method: 'GET',
  timeout: 2000,
};

const request = http.request(options, (response) => {
  console.log(`Health check status: ${response.statusCode}`);
  
  if (response.statusCode === 200) {
    process.exit(0);
  } else {
    console.error(`Health check failed with status code: ${response.statusCode}`);
    process.exit(1);
  }
});

request.on('error', (error) => {
  console.error(`Health check failed: ${error.message}`);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('Health check timed out');
  request.destroy();
  process.exit(1);
});

request.setTimeout(2000);
request.end();