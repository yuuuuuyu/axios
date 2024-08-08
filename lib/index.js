import axios from "axios";

// 默认配置
const defaultConfig = {
    timeout: 60000,
};

// 请求缓存对象
let requestCache = {};

// 原始 axios.create
const axiosCreate = axios.create;

axios.create = (config = {}) => {
    const instance = axiosCreate(Object.assign(defaultConfig, config));

    // 获取原始 get
    const axiosGet = instance.get;

    // 替换 get
    instance.get = function (url, params = {}, opt) {
        opt = Object.assign({ cache: null, timestamp: false }, opt || {});

        // 开启时间戳后请求就是全新请求
        if (opt.timestamp) {
            params = { ...params, _t: new Date().getTime() }; // 添加时间戳
        }

        // 生成唯一请求键
        const requestKey = `${url}?${new URLSearchParams(params).toString()}`;

        // 创建 CancelToken
        const source = axios.CancelToken.source();

        const createPromise = function (url, params) {
            return axiosGet(url, { params, cancelToken: source.token }) // 将 CancelToken 传递给请求
                .then((res) => {
                    if (!requestCache[requestKey]?.isCanceled) {
                        if (opt.cache === true || opt.cache === "update") {
                            requestCache[requestKey].status = "resolved";
                        } else {
                            delete requestCache[requestKey];
                        }
                        return res;
                    }
                })
                .catch((err) => {
                    if (axios.isCancel(err)) {
                        console.log('Request canceled:', err.message);
                    } else {
                        delete requestCache[requestKey];
                    }
                    return Promise.reject(err); // 处理错误
                });
        };

        // 检查是否启用缓存
        if (!opt.timestamp && opt.cache === true) {
            if (requestCache[requestKey] && requestCache[requestKey].status === "resolved") {
                return requestCache[requestKey].promise; // 返回缓存的 promise
            }
            if (requestCache[requestKey] && requestCache[requestKey].status === "pending") {
                return requestCache[requestKey].promise; // 返回正在进行中的 promise
            }
        }

        // 如果有缓存且状态为 pending，取消之前的请求
        if (requestCache[requestKey] && requestCache[requestKey].status === "pending") {
            requestCache[requestKey].source.cancel('Canceling previous request');
            requestCache[requestKey].isCanceled = true; // 标记为已取消
        }

        // 更新请求缓存
        requestCache[requestKey] = {
            status: "pending",
            promise: createPromise(url, params),
            source: source, // 保存 cancel token 的 source
            isCanceled: false // 初始化为未取消
        };

        return requestCache[requestKey].promise;
    };

    return instance;
};

export default axios;
