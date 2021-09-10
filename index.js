// index.js

// 使用 express 與 express-ws
const express = require('express')
const app = express()
const expressWs = require('express-ws')(app)
// 使用根目錄檔案作為頁面
app.use(express.static(__dirname))

// 所有房內的 WebSocket 實例
let websocketList = []
// 開啟 WebSocket 連線為 ws://localhost:3000/connection
app.ws('/connection', ws => {
  // 開啟連線
  // 使用 timestamp 充當 id
  const id = new Date().getTime()
  // 設定實例綁定該 id
  ws.id = id
  // 送出初始化事件
  ws.send(JSON.stringify({
    event: 'init',
	id,
	userList: websocketList.map(item => item.id)
  }))
  // 將該 WebSocket 實例放入清單
  websocketList.push(ws)

  // 接收事件
  ws.on('message', msg => {
    const data = JSON.parse(msg)

    // 找到發送者的 WebSocket 實例
    const taker = websocketList.find(item => item.id === data.taker)
    // 請求連線
    if (data.event === 'request') {
      taker.send(JSON.stringify({
        event: 'request',
        sender: data.sender,
        connection: data.connection
      }))
    }
    // 回應請求
    if (data.event === 'response') {
      taker.send(JSON.stringify({
        event: 'response',
        sender: data.sender,
        connection: data.connection
      }))
    }
    // 傳送連接埠資訊
    if (data.event === 'candidate') {
      taker.send(JSON.stringify({
        event: 'candidate',
        sender: data.sender,
        candidate: data.candidate
      }))
    }
  })
  
  // 關閉連線
  ws.on('close', () => {
    // 將該 WebSocket 實例移除清單
    websocketList = websocketList.filter(item => item !== ws)
    // 通知其他人將該連線斷開
	websocketList.forEach(client => {
      client.send(JSON.stringify({
        event: 'close',
        sender: ws.id
      }))
    })
  })
})

app.listen(3000)