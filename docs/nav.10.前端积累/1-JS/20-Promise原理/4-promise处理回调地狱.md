# Promise 处理回调地狱

先来看一个回调地狱的栗子, 以读取文件为例, 当前文件读取的内容是下一个文件的请求参数

```js
let fs = require('fs')
fs.readFile('./name.txt', 'utf-8', function(err, data) {
  fs.readFile(data, 'utf-8', function(err, data) {
    ....
    console.log(data)
  })
})
```

用 promsie 方式将读取文件方法进行改造

```js
function read (url) {
  return new Promise((resolve, reject) => {
    fs.readFile(url, 'utf-8', function(err, data) {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
}
```

```js
read('./name.txt').then(data => {
  console.log(data, '成功了--1') // age.txt
  // 3-1 x的值
  return read(data)
}).then(data => {
  console.log(data, '成功了--2') // 18
})
```

采用的是 promise 的链式调用，把原来的层层嵌套摊平了来写，但是嵌套的非常多的话，一直 then 下去其实也挺恶心的。

### 链式调用的特点

针对 then 返回值 x 的讨论（也就是 3-1 处）

> - 每一个 then 的调用都会返回一个新的 promsie2 保证链式调用 （promise状态不可逆）
> - 返回的 x 是一个普通值（包括undefined）, 直接作为下一个 then 的成功参数
> - 直接扔出一个错误，会将错误传递到下一个 then 的 onRejected 中
> - 返回的 x 是一个 Promsie 那就采用这个 Promsie 的状态（成功或失败）作为当前状态，并把这个 Promsie 的结果作为参数传递

根据上述链式调用的特点，继续完善 Promise 分析

- 每一个 then 的调用都会返回一个新的 promsie2 保证链式调用 （promise状态不可逆）

```js
Promise.prototype.then = function (onFulfilled, onRejected) {
  let self = this
  let promise2 = new Promise(function(resolve, reject) {
    if (self.status === 'fulfilled') {
      onFulfilled(self.value)
    }
    if (self.status === 'rejected') {
      onRejected(self.reason)
    }

    if (self.status === 'pending') {
      // 订阅 放到数组里
      self.onResolveCallbacks.push(function() {
        // 先测试下普通值的链式调用
        let x = onFulfilled(self.value)
        resolve(x)
      })
      self.onRejectedCallbacks.push(function() {
        onRejected(self.reason)
      })
    }
  })

  return promise2
}

```

暂时先添加了成功状态情况，测试下看看能否链式调用

```js
let Promise = require('./history/test')

let p = new Promise((resolve, reject) => {
  resolve(12)
})

let p2 = p.then((data) => {
  console.log(data, '成功数据---') // 12 '成功数据---'
  return '常规值--'
}, (err) => {
  console.log(err, '失败数据--')
}).then((data) => {
  console.log(data, '成功数据--p2') // 常规值-- 成功数据--p2
  return '常规值2'
}).then(data => {
  console.log(data, '成功数据--p3') // 常规值2 成功数据--p3
})
```

- 返回的 x 是一个普通值（包括undefined）, 直接作为下一个 then 的成功参数

需要一个函数 `resolvePromise` 针对 x 不同值做不同处理，先分析 x 是普通值的情况

```js
function resolvePromise(promise2, x, resolve, reject) {
  // 判断 x 是一个普通值还是一个 promise
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    let then = x.then
    if (typeof then === 'function') {
      // x 是一个 Promise
    } else {
      // { then: fn } 情况
      resolve(x)
    }
  } else {
    // x 是一个常规值将值直接传递下去
    resolve(x)
  }
}
```

把 resolvePromise 函数加到 then 里

```js
Promise.prototype.then = function (onFulfilled, onRejected) {
  let self = this
  let promise2 = new Promise(function(resolve, reject) {
    // A-A
    if (self.status === 'fulfilled') {
      let x = onFulfilled(self.value)
      resolvePromise(promise2, x, resolve, reject)
    }
    if (self.status === 'rejected') {
      onRejected(self.reason)
    }
    // ...
  })

  return promise2
}
```

调用执行下看看能否将普通值传递下去

```js
let Promise = require('./history/test')

let p = new Promise((resolve, reject) => {
  resolve(123)
})

let p2 = p.then((data) => {
  console.log(data, '--第一个then获取数据') // 123
  return data
}, (err) => {
  console.log(err, '失败数据--')
}).then(data => {
  console.log(data, '获取数据')
}, err => {
  console.log(err, '上一个then抛出异常了')
}).then(data => {
  console.log(data, '上一个then没有写return')
})
```

执行上面的代码后会报错 `ReferenceError: promise2 is not defined`, 是由于 promise2 是 then 的返回值，而 then 是异步的，但是 `resolvePromise` 函数却是同步执行的，获取不到 promsie2，就抛出了错误。修改 A-A 处的代码

```js
Promise.prototype.then = function (onFulfilled, onRejected) {
  let self = this
  let promise2 = new Promise(function(resolve, reject) {
    // A-A
    if (self.status === 'fulfilled') {
      setTimeout(() => {
        let x = onFulfilled(self.value)
        resolvePromise(promise2, x, resolve, reject)
      })
    }
    // ...
  })
  return promise2
}
```

再次执行测试代码，可以在 下一个then 的 onFulfilled 中获取数据

- 直接扔出一个错误，会将错误传递到下一个 then 的 onRejected 中

在 then 的 onFulfilled 函数中抛出一个异常，此时期望是能捕获这个错误信息同时会将这个异常传递给下一个 then 的 onRejected 函数

在 then 的 onRejected 函数中返回一个普通值，会将这个普通值传递给下一个 then 的 onFulfilled 函数

```js
let Promise = require('./history/test')

let p = new Promise((resolve, reject) => {
  resolve(123)
})

let p2 = p.then((data) => {
  console.log(data, '--第一个then获取数据') // 123
  throw new Error('直接扔出一个错误了')
}, (err) => {
  console.log(err, '失败数据--')
}).then(data => {
  console.log(data, '获取数据')
}, err => {
  console.log(err, '上一个then抛出异常了')
}).then(data => {
  console.log(data, '上一个then没有写return')
})
```

将捕获错误的代码添加到 then 中, 修改 A-A 处代码

```js
Promise.prototype.then = function (onFulfilled, onRejected) {
  let self = this
  let promise2 = new Promise(function(resolve, reject) {
    // A-A
    if (self.status === 'fulfilled') {
      setTimeout(() => {
        try {
          let x = onFulfilled(self.value)
          resolvePromise(promise2, x, resolve, reject)
        } catch(e) {
          reject(e)
        }
      })
    }
    // ...
  })

  return promise2
}
```

x 是普通值和错误情况说完了，然后说下 x 如何是一个 Promise的情况












- 返回的 x 是一个 Promsie 那就采用这个 Promsie 的状态（成功或失败）作为当前状态，并把这个 Promsie 的结果作为参数传递

在 then 调用的 onFulfilled 中返回的如果是一个 Promsie 时候，就需要执行这个 Promsie，然后获取他的状态作为当前状态进行传递，此时需要一个 函数`resolvePromise`针对 x 不同值做不同处理

**resolvePromise** 函数参数：

- promise2 : 当前 then 返回的新 Promise 的实例
- x : 当前 then 中onFulfilled & onRejected 执行后的返回值，此时还没有被 promsie2 包装
- resolve : 新 Promise 的 成功态函数
- reject : 新 Promise 的 失败态函数
