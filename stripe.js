const express = require("express");
const router = express.Router();
require('dotenv').config()
const Stripe_Key = process.env.STRIPEKEY;
const stripe = require("stripe")(Stripe_Key);
const db = require("./connectDB");
//make payment here


function runQuery(query) {
    return new Promise((resolve, reject) => {
        db.connect.query(query, function (err, data) {
            if (err) {
                console.log(err);
                resolve({ error: true, data: [] });
            } else {
                resolve({ error: false, data });
            }
        })
    })
}

router.get('/get-price-ids', async (req, res) => {
    const prices = await stripe.prices.list({
        active: true,
        type: "recurring"
    });
    let priceData = []
    for (var i = 0; i < (prices.data || []).length; i++) {
        const product = await stripe.products.retrieve(
            prices.data[i].product
        );
        const priceInfo = {
            id: prices.data[i].id,
            unit_amount: (prices.data[i].unit_amount) / 100,
            name: product.name
        }
        priceData.push(priceInfo)
    }
    res.send({ success: true, priceData: priceData })
})

router.post('/create-checkout-session', async (req, res) => {
    var orderId = new Date().getTime();
    var { data, email, name, url, mobileNumber, isOneTime, priceId } = req.body;
    if (isOneTime) {
        isOneTime = 1;
        let interval;
        priceId = priceId.split('|')
        if (priceId[1] == 1) (interval = 'month')
        if (priceId[1] == 12) (interval = 'year')
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: priceId[0],
                    quantity: 1,
                }
            ],
            mode: 'payment',
            customer_email: email,

            success_url: `${url}/${orderId}`,
            cancel_url: `${url}/${orderId}`,
        });
        try {
            db.connect.query(`insert into TestLoItems(quantity, stripeSessionId, isOneTime, email, name, mobileNumber, orderId, intervals) 
            values(1, '${session.id}', ${isOneTime} ,'${email}','${name}' ,'${mobileNumber}','${orderId}', '${interval}')`)
        } catch (err) {

        }
        res.send(session.url);
    } else {
        isOneTime = 0;
        try {
            const price = await stripe.prices.retrieve(
                data[0].priceId
            );

            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price: data[0].priceId,
                        quantity: data.length,
                    }
                ],
                mode: 'subscription',
                customer_email: email,

                success_url: `${url}/${orderId}`,
                cancel_url: `${url}/${orderId}`,
            });
            try {
                for (var i = 0; i < (data || []).length; i++) {
                    db.connect.query(`insert into TestLoItems(classId, subjectId, quantity, stripeSessionId, isOneTime, email, name, mobileNumber, orderId, intervals) 
                values('${data[i].classId}','${data[i].subjectId}', 1, '${session.id}', ${isOneTime} ,'${email}','${name}' ,'${mobileNumber}','${orderId}', '${price.recurring.interval}')`)
                }
            } catch (err) {

            }
            res.send(session.url);
        } catch (error) {
            console.log(error);
        }
    }
});

router.get('/postPayment/:orderId', async (req, res) => {
    const orderId = req.params.orderId;
    try {
        let records = await runQuery(`select * from TestLoItems where orderId = ${orderId}`);
        const stripeId = records.data.recordset[0].stripeSessionId
        if (records.data.recordset[0].payStatus == 'paid') {
            res.send({ success: true, msg: 'status already paid' })
        } else {
            const paymentData = await stripe.checkout.sessions.retrieve(stripeId)
            await runQuery(`update TestLoItems set payStatus = '${paymentData.payment_status}' WHERE orderId = '${orderId}'`);
            res.send({ success: true, msg: 'status updated' })
        }
    } catch (error) {
        console.log(error);
    }
})

module.exports = router;