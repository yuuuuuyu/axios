import axios from "axios";

// 默认配置
const defaultConfig = {
    timeout: 60000,
}

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
        opt = Object.assign({ cache: null, }, opt || {});
        // 开启时间戳后请求就是全新请求
        opt.timestamp && (params = Object.assign(params.params, { _t: new Date().getTime() }))
        const requestKey = url;

        const createPromise = function (url, params) {
            return axiosGet(url, params)
                .then((res) => {
                    console.log(123, res)
                    if (opt.cache === true || opt.cache === "update") {
                        requestCache[requestKey].status = "resolved";
                    } else {
                        delete requestCache[requestKey];
                    }
                    return res;
                })
                .catch((err) => {
                    delete requestCache[requestKey];
                    return err;
                });
        };


        if (
            !requestCache[requestKey] || // 无缓存
            (requestCache[requestKey].status !== "pending" && opt.cache === "update") || // 有缓存且要更新缓存
            opt.cache === false // 不需要缓存
        ) {
            requestCache[requestKey] = {
                status: "pending",
                promise: createPromise(url, params),
            };
        }
        return requestCache[requestKey].promise;
    };

    return instance;
};


export default axios;