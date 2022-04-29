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
    db.connect.query(`select distinct SubjectMaster.SubjectID , SubjectMaster.SubjectCode , SubjectMaster.SubjectName,
    ClassMaster.ClassId , ClassMaster.ClassName
    from ClassMaster ClassMaster
    inner join EA_SubjectMaster on ClassMaster.ClassId = EA_SubjectMaster.ClassId
    inner join SubjectMaster on SubjectMaster.SubjectId = EA_SubjectMaster.SubjectId and SubjectMaster.SubjectStatus = 1
    where ClassMaster.IsShowInTestLo = 1 and SubjectMaster.IsShowInTestLo = 1`, function (err, classIdsData) {

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