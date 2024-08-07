<template>
  <div>
    <div class="wrap">
      <h1 class="title">基于Axios封装，为 Instance.get() 扩展了缓存功能</h1>

      <div class="link">
        <a class="link-item" href="https://github.com/yuuuuuyu/axios"></a
        ><a
          class="link-item"
          href="https://www.npmjs.com/package/@beeboat/axios"
        ></a>
      </div>
      <el-button @click="testRequest(true)" type="primary">
        请求(缓存开)
      </el-button>
      <el-button @click="testRequest(false)" type="danger">
        请求(缓存关)
      </el-button>
      <el-button @click="testRequest('update')" type="success">
        请求(更新缓存)
      </el-button>
      <el-button @click="multiRequest()"> 并发3次请求(默认) </el-button>
      <el-button @click="multiRequest(false)"> 并发3次请求(缓存关) </el-button>
      <div class="log">
        <el-button :icon="Delete" circle @click="clear()" />

        <div v-for="(item, index) in log" :key="index" class="log-item">
          {{ item }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { Delete } from "@element-plus/icons-vue"
// import axios from "@beeboat/axios"
// import axios, { AxiosInstance } from "../lib"
import axios from "../lib"

// 创建请求实例
const instance = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
})

const log = ref([])
const clear = () => {
  log.value = []
}
const testRequest = cacheOption => {
  return instance
    .get(
      "http://localhost:9999/api/data",
      //   { params: { name: Math.random() } },
      { params: { name: 11 } },
      {
        cache: cacheOption,
        timestamp: false,
      }
    )
    .then(res => {
      console.log(res, "[[[[[[[]]]]]]]")
      log.value.push(`${new Date().getTime()}: ${JSON.stringify(res)}`)
    })
    .catch(err => {
      log.value.push(`${new Date().getTime()}: ${err.message || err}`)
    })
}
const multiRequest = cacheOption => {
  for (let i = 0; i < 3; i++) {
    testRequest(cacheOption)
  }
}

// setInterval(() => {
//   testRequest(false)
// }, 100)

// 请求队列
const pending = new Map()

const generateReqKey = config => {
  const { url, method, params, data } = config
  return [url, method, JSON.stringify(params), JSON.stringify(data)].join("&")
}

const onRemoveReqSequence = config => {
  const requestKey = generateReqKey(config)
  console.log(pending.has(requestKey), "onRemoveReqSequence....")
  if (pending.has(requestKey)) {
    const cancel = pending.get(requestKey)
    console.log(cancel, "cancel....")
    cancel(`操作频繁已取消:${config.url}, ${JSON.stringify(config.params)}`)
    pending.delete(requestKey)
    console.log(pending, "deleted....")
  }
}

const onAppendReqSequence = (config, cancel) => {
  const requestKey = generateReqKey(config)
  console.log(requestKey)
  pending.set(requestKey, cancel)
}
instance.interceptors.request.use(config => {
  onRemoveReqSequence(config) // 移除旧请求
  const { CancelToken } = axios
  config.cancelToken = new CancelToken(cancel => {
    onAppendReqSequence(config, cancel) // 添加新请求
  })
  console.log(pending, "pending.....")

  return config
})
instance.interceptors.response.use(
  response => {
    const { data, config } = response
    onRemoveReqSequence(config)
    try {
      if (
        config?.responseType == "blob" ||
        config?.responseType == "arraybuffer"
      ) {
        return response
      } else {
        return data
      }
    } catch (error) {
      return Promise.reject(response)
    }
  },
  error => {
    const $error = error
    $error.isCancelRequest = axios.isCancel($error)
    console.log(123123, $error.isCancelRequest)
    if ($error.isCancelRequest) {
      console.error($error.message)
      return new Promise(() => {})
    } else {
      // 所有的响应异常 区分来源为取消请求/非取消请求
      return Promise.reject($error)
    }
  }
)
</script>
<style scoped>
.wrap {
  width: 1200px;
  margin: 50px auto;
}

.title {
  font-size: 1.6em;
  font-weight: normal;
  margin-bottom: 20px;
}
.link {
  display: flex;
  height: 50px;
  margin-bottom: 20px;
}
.link .link-item {
  width: 50px;
  height: 100%;
  margin-right: 20px;
}
.link .link-item:nth-child(1) {
  background: url("./assets/icon/github-fill.png") center/contain no-repeat;
}
.link .link-item:nth-child(2) {
  background: url("./assets/icon/npm.png") center/contain no-repeat;
}
.log {
  text-align: left;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  margin: 20px 0;
  min-height: 10em;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 20px;
}
.log-item {
  height: 40px;
  line-height: 40px;
}
</style>

