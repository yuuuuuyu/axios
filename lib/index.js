import axios from 'axios'
// 默认配置
const defaultConfig = {
    timeout: 60000,
}

// 请求缓存对象
let requestCache = {}

// 原始 axios.create
const axiosCreate = axios.create

// 转换入参
const convertToObject = input => {
    if (typeof input === 'string') {
        try {
            return JSON.parse(input)
        } catch (e) {
            console.error('Failed to parse input string to object', e)
            return input
        }
    } else if (typeof input === 'object' && input !== null) {
        return input
    } else {
        console.error('Invalid input type', input)
        return input
    }
}
// 生成唯一请求键
const generateRequestKey = config => {
    const _tag = config.method === 'get' ? config.params : convertToObject(config.data)
    return `${config.url}-${new URLSearchParams(_tag).toString()}`
}

// 创建 CancelToken
const createCancelToken = config => {
    const method = config.method.toLowerCase()
    const requestKey = generateRequestKey(config)
    const source = axios.CancelToken.source()

    if (requestCache[requestKey] && requestCache[requestKey].status === 'pending') {
        requestCache[requestKey].source.cancel(`操作频繁已取消对 ${config.url} 的请求`)
        if (method === 'get') {
            requestCache[requestKey].isCanceled = true
        }
    }
    requestCache[requestKey] = {
        status: 'pending',
        source: source,
        isCanceled: false,
    }
    config.cancelToken = source.token
}

axios.create = (config = {}) => {
    const instance = axiosCreate(Object.assign(defaultConfig, config))

    // 请求拦截器
    instance.interceptors.request.use(
        config => {
            createCancelToken(config)
            return config
        },
        error => {
            return Promise.reject(error)
        },
    )

    // 响应拦截器
    instance.interceptors.response.use(
        response => {
            const requestKey = generateRequestKey(response.config)
            if (response.config.method.toLowerCase() === 'get') {
                if (!requestCache[requestKey]?.isCanceled) {
                    delete requestCache[requestKey]
                }
            } else {
                delete requestCache[requestKey]
            }
            return response
        },
        error => {
            if (axios.isCancel(error)) {
                console.error(error.message)
                // 仅输出自定义报错信息，无须axios拦截
                return new Promise(() => { });
            } else {
                const requestKey = generateRequestKey(error.config)
                delete requestCache[requestKey]
            }
            return Promise.reject(error)
        },
    )

    // 获取原始 get
    const axiosGet = instance.get
    // 替换 get
    instance.get = function (url, params = {}, opt) {
        opt = Object.assign({ cache: null, timestamp: false }, opt || {})

        // TODO
        if (opt.timestamp) {
            params = { params: { ...params, _t: new Date().getTime() } } // 添加时间戳
        } else {
            params = { params: { ...params } }
        }

        const requestKey = `${url}?${new URLSearchParams(params).toString()}`
        const source = axios.CancelToken.source()

        const createPromise = function (url, params) {
            return axiosGet(url, { params: params.params, cancelToken: source.token }) // 将 CancelToken 传递给请求
                .then(res => {
                    if (!requestCache[requestKey]?.isCanceled) {
                        if (opt.cache === true || opt.cache === 'update') {
                            requestCache[requestKey].status = 'resolved'
                        } else {
                            delete requestCache[requestKey]
                        }
                        return res
                    }
                })
                .catch(err => {
                    return Promise.reject(err)
                })
        }

        // 检查是否启用缓存
        if (!opt.timestamp && opt.cache === true) {
            if (requestCache[requestKey] && requestCache[requestKey].status === 'resolved') {
                return requestCache[requestKey].promise
            }
            if (requestCache[requestKey] && requestCache[requestKey].status === 'pending') {
                return requestCache[requestKey].promise
            }
        }

        // 更新请求缓存
        requestCache[requestKey] = {
            status: 'pending',
            promise: createPromise(url, params),
            source: source,
            isCanceled: false,
        }
        return requestCache[requestKey].promise
    }
    return instance
}

export default axios
