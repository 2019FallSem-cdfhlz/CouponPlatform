'use strict'

const fs = require('fs')

const { signIn, signUp, getCoupon, getCouponInfo, createCoupon, batchRegister } = require('./api')

async function main () {
    if (!fs.existsSync('users.json')) {
        // 支持从200到6200的并发量
        await batchRegister('ljl', 99200, 'customer')
    }
        
    const users = require('./users.json')
    
    let saler = { username: 'jzh', password: '123456', kind: 'saler' }
    await signUp(saler).catch(console.error)
    saler = await signIn(saler)

    let couponName = 'testa'
    let amount = 100000

    await createCoupon(saler, {
        name: couponName,
        amount,
        description: 'nothing special',
        stock:100
    })
    
    let start = 0
    let step = 200

    while (start < users.length) {
        const target_user = users.slice(start, start + step)
        const time_average = Array.from({ length: target_user.length })
        let err_cnt = 0
        await Promise.all(target_user.map((user, i) => {
            return new Promise(async (resolve, reject) => {
                const start_time = new Date()
                try {
                    user = (await signIn(user))
                    await getCoupon(user, saler.username, couponName)
                    const coupons = await getCouponInfo(user, user.username)
                    const salerCoupons = await getCouponInfo(user, saler.username)
                } catch (err) {
                    console.log(err.stack)
                    ++err_cnt
                }
                time_average[i] = new Date() - start_time
                resolve()
            })
        })).then(() => {
            console.log(`步长: ${step}, 用户平均响应时间: ${time_average.reduce((a, b) => a + b) / step}, 错误计数: ${err_cnt}`)
        })

        start += step
        step += 200
    }
}

main()