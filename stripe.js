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

router.post('/create-checkout-session', async (req, res) => {
    var orderId = new Date().getTime();
    var { unit_amount, classId, subjectId, email, url } = req.body;
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price_data: {
                    currency: "INR",
                    product_data: {
                        name: classId + subjectId,
                    },
                    unit_amount: unit_amount * 100,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',

        success_url: `${url}/${orderId}`,
        cancel_url: `${url}/${orderId}`,
    });
    db.connect.query(`insert into TestLoItems(classId, subjectId, price, quantity, stripeSessionId, email, orderId) 
    values('${classId}','${subjectId}', ${unit_amount}, 1, '${session.id}' ,'${email}', '${orderId}')`)

    res.send(session.url);
});

router.get('/postPayment/:orderId', async (req, res) => {
    const orderId = req.params.orderId;

    let records = await runQuery(`select * from TestLoItems where orderId = ${orderId}`);
    const stripeId = records.data.recordset[0].stripeSessionId
    if (records.data.recordset[0].payStatus == 'paid') {
        res.send({ success: true, msg: 'status already paid' })
    } else {
        const paymentData = await stripe.checkout.sessions.retrieve(stripeId)
        await runQuery(`update TestLoItems set payStatus = '${paymentData.payment_status}' WHERE orderId = '${orderId}'`);
        res.send({ success: true, msg: 'status updated' })
    }
})

module.exports = router;