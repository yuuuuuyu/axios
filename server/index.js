const express = require('express');
const cors = require('cors');
const app = express();
const port = 9999;

app.use(cors());

// 定义一个 GET 接口
app.get('/api/data', (req, res) => {
    const data = {
        message: 'Hello, World!',
        timestamp: new Date()
    };
    res.json(data);
});

// 启动服务器
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
