var express = require('express')
var app = express()
var bodyParser = require('body-parser')

var cors = require('cors')

var mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


var users=[];
var _id = 0;
var addedExercises=[];

app.post('/api/exercise/new-user',function(req,res){
  let userData = {};
  var username = req.body.username;
  ++_id;
  userData[_id]=username
  users.push(userData);
  res.send(userData);
});

app.get('/api/exercise/users',function(req,res){
  res.send(users);
});


var dateTest = /\d{4}-\d{2}-\d{2}/;


app.post('/api/exercise/add',function(req,res){
  if(req.body.userId<=_id){
    var userId = req.body.userId;
    var description = req.body.description;
    var duration = req.body.duration;
    
    var maybeDate = req.body.date;
    
    if(maybeDate == null || maybeDate == undefined){
      var date = new Date().toISOString().slice(0,10);
    }
    else if(maybeDate.match(dateTest) && maybeDate.length==10){
      var date = req.body.date;
    }
    
    else{
      var date = new Date().toISOString().slice(0,10);
    }
    
    addedExercises.push({'userName':users.filter(d=>d[userId])[0][userId],'userId':userId,
                         'description':description,'duration':duration,'date':date})
    
    res.send({'userName':users.filter(d=>d[userId])[0][userId],'userId':userId,
              'description':description,'duration':duration,'date':date})
  }
  else{
    res.send({'userId':'invalid'});
  }
});

app.get('/api/exercise/log/:userId',function(req,res){
  var _userId = req.params.userId;
  var _from = req.query.from;
  var _to = req.query.to;
  var _limit = Math.round(req.query.limit);
  
  var logData = []
  
  if(_from != null || _from != undefined){
    if(_from.match(dateTest) && _from.length==10){
      var _fromDate = req.query.from;
    }
    else{
      var _fromDate = null;
    }
  }
  
  else{
    var _fromDate = null;
  }
  
  if(_to != null || _to != undefined){
    if(_to.match(dateTest) && _to.length==10){
      var _toDate = req.query.to;
    }
    else{
      var _toDate = null;
    }
  }
  
  else{
    var _toDate = null;
  }
  
  var _fromDateStr = ""+_fromDate+"";
  var _toDateStr = ""+_toDate+""
  
  for(let i=0; i<addedExercises.length;++i){
    if(addedExercises[i].userId==_userId && (Number(addedExercises[i].date.replace(/-/g,""))>=Number(_fromDateStr.replace(/-/g,"")) 
      || _fromDate==null) && (Number(addedExercises[i].date.replace(/-/g,""))<=Number(_toDateStr.replace(/-/g,"")) || _toDate==null)){
      
      logData.push(addedExercises[i]);
      
    }
  }
  
  
  if(_limit>0 && (_limit!=null || _limit!=NaN || _limit!=undefined)){
    var limitedData = logData.slice(0,_limit);
  }
  
  else{
    var limitedData = logData;
  }
  
  var exerciseCount = addedExercises.filter(d=>d[_userId]).length;
  
  limitedData.push({"total_exercise_count":exerciseCount});
  
  res.send(limitedData);
})


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
