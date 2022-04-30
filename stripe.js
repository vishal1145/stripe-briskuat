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
    });
    let priceData = []
    for (var i = 0; i < (prices.data || []).length; i++) {
        const product = await stripe.products.retrieve(
            prices.data[i].product
        );
        const priceInfo = {
            id: prices.data[i].id,
            unit_amount: (prices.data[i].unit_amount)/100,
            name: product.name
        }
        priceData.push(priceInfo)
    }
    res.send({ success: true, priceData: priceData })
})

router.post('/create-checkout-session', async (req, res) => {

    var orderId = new Date().getTime();
    try {
        var { data, email, url, mobileNumber } = req.body;
        const session = await stripe.checkout.sessions.create({
            // line_items: data.map((item) => {
            //     return {
            //         price: item.priceId,
            //         quantity: 1,
            //     }
            // }),
            line_items: [
                {
                    price: data[0].priceId,
                    quantity: data.length,
                }
            ],
            mode: 'subscription',

            success_url: `${url}/${orderId}`,
            cancel_url: `${url}/${orderId}`,
        });
        try {
            for (var i = 0; i < (data || []).length; i++) {
                db.connect.query(`insert into TestLoItems(classId, subjectId, quantity, stripeSessionId, email, mobileNumber, orderId) 
            values('${data[i].classId}','${data[i].subjectId}', ${data.length}, '${session.id}' ,'${email}', '${mobileNumber}','${orderId}')`)
            }
        } catch (err) {

        }
        res.send(session.url);
    } catch (error) {
        console.log(error);
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