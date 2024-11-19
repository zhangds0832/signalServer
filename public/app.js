const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');

let localStream;
let peerConnection;

// STUN/TURN 服务器配置
const iceServers = {
    iceServers: [
        { urls: 'stun:xxx' }, // STUN 服务器
        { 
            urls: 'turn:xxx', // 替换为您的 TURN 服务器地址
            username: 'xxx', // TURN 用户名
            credential: 'xxx' // TURN 密码
        }
    ]
};

// 创建 Socket.IO 连接
const socket = io();

async function startCall() {
    // 检查 getUserMedia 是否可用
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia is not supported in this browser.');
        alert('Your browser does not support getUserMedia. Please try a different browser.');
        return;
    }

    // 获取本地视频流
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;

    // 创建 PeerConnection
    peerConnection = new RTCPeerConnection(iceServers);

    // 将本地流添加到 PeerConnection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // 处理远程流
    peerConnection.ontrack = event => {
        remoteVideo.srcObject = event.streams[0];
    };

    // 处理 ICE 候选
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('signal', { iceCandidate: event.candidate }); // 发送 ICE 候选
        }
    };

    // 创建并发送 offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('signal', { offer }); // 发送 offer 到信令服务器
}

// 监听信令消息
socket.on('signal', async message => {
    if (message.offer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('signal', { answer }); // 发送 answer 回发起者
    } else if (message.answer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
    } else if (message.iceCandidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.iceCandidate));
    }
});

// 绑定按钮事件
startButton.onclick = startCall;