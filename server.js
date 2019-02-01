//express
const express = require('express');
//mongoose
const mongoose = require('mongoose');
//methodOverride
const methodOverride = require('method-override');
//multer
const multer = require('multer');
//gfs
const GridFsStorage = require('multer-gridfs-storage');
//
const Grid = require('gridfs-stream');
//path
const path = require('path');
//
const bodyParser = require('body-parser');

const crypto = require('crypto');

//calling
var app =  express();


var port_no = 3000;


//ejs for views
app.set('view engine','ejs');



var db_uri = 'mongodb://testBooks:testBooks1@ds113845.mlab.com:13845/book_rest_api';
//mongoose url
mongoose.connect(db_uri);


//Middleware for the bodyParser
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

//
app.use(methodOverride('_method'))




//mongoose connection
var conn = mongoose.connection;



//db err
conn.on('err',function (err)
{
  console.log('err on db'+err);
});



let gfs;


//db connect
conn.once('open',function () {

  //init gridfs-stream github
   gfs = Grid(conn.db, mongoose.mongo);
   gfs.collection('uploads');
  // all set!
});

//create storage engine multer-gridfs-storage  github
const storage = new GridFsStorage({
  url: db_uri,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

//get method
app.get('/',function (request,response)
{
  response.render('index');
});




//post method
app.post('/upload', upload.single('uploadfile'),function (request,response)
{
  //response.json({file:request.file});
   response.redirect('/');
});




// @route GET /files
// @desc  Display all files in JSON
app.get('/files',function (request,response)
{
         gfs.files.find().toArray(function (err,files)
         {
             if(err)
               {
                 console.log(err);
                 response.status(404).json(err);
               }
               else {
                 console.log(files);
                 response.send(files);
               }

         })
});


//get by filename
app.get('/files/:filename', function(request,response)
{

    console.log('filename By Name'+request.params.filename);

    gfs.files.findOne({filename: request.params.filename},function (err,file)
    {

        if(err)
          {
            console.log('err'+err);
            response.status(404).send(err);
          }
          else {
            response.send(file);
          }

    })

})



//get by filename  github gridfs-stream topic createreadstream
app.get('/image/:filename', function(request,response)
{

    console.log('filename By Name'+request.params.filename);

    gfs.files.findOne({filename: request.params.filename},function (err,file)
    {

        if(err || (!file || file.length ===0 ))
          {
            console.log('err'+err);
            response.status(404).send(err);
          }
          else
          {

            //check if image
            if(file.contentType === 'image/jpeg'|| file.contentType === 'img/png'|| file.contentType === 'text/plain')
            {
            //response.send(file);
            var readstream = gfs.createReadStream(file.filename);

            readstream.pipe(response);
            }

            else {
              res.status(404).send(err);
            }
         }

    })

})



//delete file By id
//add root:'uploads'
app.delete('/files/del/:id',function (request,response)
{

    console.log('delete By filename'+request.params.id);
    gfs.remove({_id:request.params.id,root:'uploads'},function (err, files)
    {

        if(err)
          {
            response.send(err);
          }
          else {
            response.redirect('/');
          }

    });
});



app.listen(process.env.port||port_no);

console.log('server listen to the port'+port_no);
