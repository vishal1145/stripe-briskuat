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
    try {
        var { unit_amount, data, email, url, product_name } = req.body;
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: "INR",
                        product_data: {
                            name: product_name,
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
        for (var i = 0; i < (data || []).length; i++) {
            db.connect.query(`insert into TestLoItems(classId, subjectId, price, quantity, stripeSessionId, email, orderId) 
    values('${data[i].classId}','${data[i].subjectId}', ${unit_amount}, 1, '${session.id}' ,'${email}', '${orderId}')`)
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