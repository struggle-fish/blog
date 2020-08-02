# Promise 订阅发布

### Promise 执行器中是异步情况

```js
let promise = new Promise((resolve, reject) => {
  // 2-1 异步执行 resolve
  setTimeout(() => {
    resolve('成功数据')
  }, 1000)
})

promise.then((val) => {
  console.log(val, '成功回调--')
}, (err) => {
  console.log(err, '失败回调--')
})

```

如果Promise里执行器是异步的，给 promsie 添加订阅-发布来执行异步

```js
function Promise(executor) {
  let self = this
  self.status = 'pending'
  self.value = undefined
  self.reason = undefined

  // 定义两个队列，存放对应的回调函数
  self.onResolveCallbacks = []
  self.onRejectedCallbacks = []

  function resolve (value) {
    if (self.status === 'pending') {
      self.value = value
      self.status = 'fulfilled'
      // 发布的时候将数组里的函数依次执行
      self.onResolveCallbacks.forEach(fn => fn())
    }
  }

  function reject (reason) {
    if (self.status === 'pending') {
      self.reason = reason
      self.status = 'rejected'
      self.onRejectedCallbacks.forEach(fn => fn())
    }
  }

  try {
    executor(resolve, reject)
  } catch (e) {
    reject(e)
  }
}

Promise.prototype.then = function (onFulfilled, onRejected) {
  let self = this
  if (self.status === 'fulfilled') {
    onFulfilled(self.value)
  }
  if (self.status === 'rejected') {
    onRejected(self.reason)
  }

  // 如果执行器里是定时器执行 resolve 2-1
  // 如果执行器里是异步的时候，需要把成功和失败分别存放到数组里
  // 当调用 resolve 会让函数依次执行，执行的时候会将成功或失败的值进行传递
  if (self.status === 'pending') {
    // 订阅 放到数组里
    self.onResolveCallbacks.push(function() {
      onFulfilled(self.value)
    })
    self.onRejectedCallbacks.push(function() {
      onRejected(self.reason)
    })
  }
}


```
