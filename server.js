const express = require("express");
const app = express();
const stripe = require("./stripe");
const port = process.env.PORT || 3000;

const db = require('./connectDB')
app.use(express.json());
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
    db.connect.query(`select * from EA_SectionMaster sm where 1= 2;
  select top 10 sm.SubjectID , sm.SubjectCode , sm.SubjectName , 
  '3EF16A5E-0949-4E1D-8471-0000064F707C' as ClassId , '12th' as ClassName from SubjectMaster sm `, function (err, classIdsData) {

      if (err) console.log(err)

      res.send(classIdsData.recordsets[1]);
    });
  } catch (error) {
    console.log(error);
  }

})

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

app.use("/stripe/", stripe);