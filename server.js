const express = require('express');
// const https = require('https');
const http = require('http');
const fs = require('fs');
const socketIo = require('socket.io');

// 读取 SSL/TLS 证书
// const privateKey = fs.readFileSync('server.key', 'utf8');
// const certificate = fs.readFileSync('server.cert', 'utf8');
// const credentials = { key: privateKey, cert: certificate };

// 创建 Express 应用
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 处理静态文件（例如 HTML 和 JS）
app.use(express.static('public')); // 假设您的 HTML 和 JS 文件在 public 文件夹中

// 处理客户端连接
io.on('connection', (socket) => {
    console.log('New client connected');

    // 处理信令消息
    socket.on('signal', (message) => {
        // 将信令消息转发给其他客户端
        socket.broadcast.emit('signal', message);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});