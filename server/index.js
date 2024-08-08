const express = require('express');
const cors = require('cors');
const app = express();
const port = 9999;

const corsOptions = {
    origin: 'http://localhost:5173',  // 允许的源
    credentials: true,                 // 允许携带凭证
};

app.use(cors(corsOptions));

// 定义一个 GET 接口
app.get('/api/data', (req, res) => {
    const name = req.query;
    const data = {
        message: 'Hello, World!',
        query: name,
        timestamp: new Date()
    };
    res.json(data);
});

// 定义一个 POST 接口
app.post('/api/data2', (req, res) => {
    const receivedData = req.body; // 获取请求体中的数据
    const responseData = {
        message: 'Data received successfully!',
        data: receivedData,
        timestamp: new Date()
    };
    res.json(responseData); // 返回接收到的数据
});

// 模拟一个数据存储
let dataStore = [];
// 定义一个 PUT 接口
app.put('/api/data3/:id', (req, res) => {
    const id = parseInt(req.params.id); // 获取 URL 参数中的 ID
    const updatedData = req.body;        // 获取请求体中的数据

    // 查找并更新数据
    if (id >= 0 && id < dataStore.length) {
        dataStore[id] = updatedData; // 用新的数据替换旧的数据
        res.json({
            message: 'Data updated successfully!',
            data: updatedData,
            timestamp: new Date(),
        });
    } else {
        res.json({
            message: 'Data not found',
            data: [],
            timestamp: new Date(),
        });
    }
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
