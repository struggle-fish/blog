# Promise 基础实现

::: tip  Promise
Promise 是一个类，中文意思是，许诺，允诺，希望

pending 等待状态 -> 成功状态（fulfilled）

pending 等待状态 -> 失败状态 (rejected)

状态改变后是不可逆的
:::

```js
// 基础语法
new Promise(executor(resolve, reject)).then(onFulfilled, onRejected)
```

- 执行器 executor 是同步执行的

```js
new Promise((resolve, reject) => {
  console.log(1)
  resolve()
}).then(() => {
  console.log(2)
})
console.log(3)
// 1 3 2
```

- 执行器中调用 resolve 会将数据传递到 then 中的 onfulfilled 函数，调用 reject 会将错误信息传递到 onrejected 函数

```js
let promise = new Promise(function (resolve, reject) {
  // resolve('成功了--') -> then 里的 onfulfilled 接收数据
  // reject('失败了--') -> then 里的 onrejected 接受失败信息
  // 1-1 如果执行器函数报错了走 reject
  throw new Error('执行器函数报错了')
})

// onfulfilled , onrejected 函数
promise.then(function(val) {
  console.log(val, '成功')
}, function(err) {
  console.log(err, '失败')
})
```

### 实现基础版本的 Promise

::: details 点击查看代码
```js
function Promise (executor) {
  let self = this
  // 给 Promise 定义状态
  self.status = 'pending'
  // 成功或失败的原因
  self.value = undefined
  self.reason = undefined
  
  // 执行器里放的两个函数
  function resolve (value) {
    // 只有当前状态是 pending 才进入条件
    if (self.status === 'pending') {
      self.value = value
      self.status = 'fulfilled'
    }
  }

  function reject (reason) {
    if (self.status === 'pending') {
      self.reason = reason
      self.status = 'rejected'
    }
  }

  // 调用执行器
  try {
    executor(resolve, reject)
  } catch (e) {
    // 如果执行器里直接抛出了错误，把错误信息传递给 reject 1-1
    reject(e)
  }
}

// 原型上的方法 then
Promise.prototype.then = function (onFulfilled, onRejected) {
  let self = this
  // 状态成功的时候调用成功的回调函数
  if (self.status === 'fulfilled') {
    onFulfilled(self.value)
  }
  // 状态失败情况
  if (self.status === 'rejected') {
    onRejected(self.reason)
  }
}

```
:::