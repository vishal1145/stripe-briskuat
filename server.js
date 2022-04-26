const express = require("express");
const app = express();
const stripe = require("./stripe");
const port = process.env.PORT || 1600;
var cors = require('cors')
const db = require('./connectDB')
app.use(express.json());
app.use(cors())
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason)
});
// app.get('/', async (req, res) => {

//    db.connect.query('select * from AcademicYearMaster', function (err, academicYearRecord) {

//     if (err) console.log(err)

//     res.send(academicYearRecord);
//   });

// });

app.get("/getClassIds", async (req, res) => {
  try {
    db.connect.query(`select top 3 sm.SubjectID , sm.SubjectCode , sm.SubjectName , 
    '3EF16A5E-0949-4E1D-8471-0000064F707C' as ClassId , '12th' as ClassName from SubjectMaster sm 
    union
    select top 5 sm.SubjectID , sm.SubjectCode , sm.SubjectName , 
    '3EF16A5E-0949-4E1D-8471-0000064F707A' as ClassId , '11th' as ClassName from SubjectMaster sm `, function (err, classIdsData) {

      if (err) console.log(err)

      res.send(classIdsData.recordsets[0]);
    });
  } catch (error) {
    console.log(error);
  }

})

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

app.use("/stripe/", stripe);