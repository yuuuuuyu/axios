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

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
