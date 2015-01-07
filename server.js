var path = require('path');
var express = require('express');
var app = express();
var fs = require('fs');
var url = require("url");
var querystring = require("querystring");
var MongoClient = require('mongodb').MongoClient;
var BSON = require('mongodb').BSONPure;
// Serve static files
app.use(express.static(__dirname+'/file')); 

// NEW: Handle requests for a single book
app.get('/books/:id', function(req, res){
  res.send('The details of book ' + req.params.id + ' should go here');
});

// NEW: Handle request for a list of all books
app.get('/books', function(req, res){
  res.send('A list of books should go here');
});

// Route for everything else.

app.get('startplay', function(req, res){
  var urlObject=url.parse(req.url); //將URL解析為json物件
  var pathname=urlObject.pathname;
  
  fs.readFile( __dirname + "/file" +pathname , function (err, file) { //__dirname為當下資料夾位置
      if (err) {
        console.log("View Error:"+err.message);
      }       
    res.writeHead(200, {"Content-Type": "audio/mpeg" });
    res.write(file);
    res.end();
    });
});

app.post('/logback.js',function(req , res){
  var postData="";
  var dataObject;
  //接收post資料
  console.log("in logback!");
   req.addListener("data", function(postDataChunk) {
   postData += postDataChunk;
    });
    req.addListener("end", function() {
    if(postData !== ""){ //have post data
     dataObject=querystring.parse(postData);
     console.log("invite in server.and have POST data: "+ JSON.stringify(dataObject));
      
      //以下從資料調資料比對帳號密碼
      MongoClient.connect("mongodb://127.0.0.1:27017/test", function(err, db) {
      if(err) { return console.log("db Error: "+err); }
      console.log("comes "+dataObject.nickname+" and "+dataObject.password);
          db.createCollection('game', function(err, collection) {
            if(err) { return console.log("collection create err: "+err); }
              collection.findOne({ account: dataObject.nickname }, function(err, item) { //將dataObject插入mongo-以json形式儲存
                console.log(JSON.stringify(item));
                if(err){
                   console.log("db nickname find err: "+err); 
                }else if(item===null) { //item 為 json
                          res.writeHead(200, {"Content-Type": "text/plain" });
                          collection.insert({account: dataObject.nickname, password:dataObject.password,score: 0 }, {w:1}, function(err, result) { 
                          if(err) { return console.log("db insert err: "+err); }
                                console.log("new account insert database success!");
                                collection.findOne({ account: dataObject.nickname }, function(err, item) {
                                  res.write(JSON.stringify({ message: "error nickname" , id:item._id.valueOf()}));
                                  res.end();
                                  db.close();
                                });
                          });
                          
                        }else{
                console.log("nickname find from database success!");
                if( dataObject.password == item.password ){
                  res.writeHead(200, {"Content-Type": "text/plain" });
                  res.write(JSON.stringify({ message: "get id" , id:item._id.valueOf() }));
                  res.end();
                  db.close();
                }else{
                  console.log("but password find item wrong."); 
                  res.writeHead(200, {"Content-Type": "text/plain" });
                  res.write(JSON.stringify({ message: "error password" , id:item._id.valueOf() }));
                  res.end();
                  db.close();
                }
               }
              });
          });
    });
    }    
  });
});

app.get('/smart1/:gid', function(req, res){
        console.log("you go to smart1 ");
       
        MongoClient.connect("mongodb://127.0.0.1:27017/test", function(err, db) {
        if(err) { return console.log("smart1 db Error: "+err); }
         console.log("comes "+ req.params.gid);
         db.createCollection('game', function(err, collection) {
            if(err) { return console.log("smart1 collection create err: "+err); }
              collection.findOne({ _id :BSON.ObjectID.createFromHexString(req.params.gid) }, function(err, item)               { 
                console.log("smart1 find "+JSON.stringify(item));
                if(err){
                   console.log("db _id find err: "+err); 
                }else{
                  res.redirect("../smart1.html?nick="+item.account+"&score="+item.score);
                }
              });
         });
        });
  
});
app.get('/smart2/:nick', function(req, res){
        console.log("you go to smart2 ");
       
        MongoClient.connect("mongodb://127.0.0.1:27017/test", function(err, db) {
        if(err) { return console.log("smart2 db Error: "+err); }
         console.log("comes "+ req.params.nick+" and "+req.param("score"));
         db.createCollection('game', function(err, collection) {
            if(err) { return console.log("smart2 collection create err: "+err); }
           collection.update({account : req.params.nick},{$set:{score: parseInt(req.param("score"))}},function(err, result){
             if(err){console.log("smart2 update data Error: "+err);}
             console.log(req.params.nick+" successful update the score");
             res.redirect("../result.html?nick="+req.params.nick);
           });
         });
          
        });
       
});
app.get('/resultback.js', function(req, res){
          console.log("you go to resultback ");
        MongoClient.connect("mongodb://127.0.0.1:27017/test", function(err, db) {
        if(err) { return console.log("resultback db Error: "+err); }
         db.createCollection('game', function(err, collection) {
            if(err) { return console.log("result collection create err: "+err); }
            collection.find().sort({score:-1}).toArray(function(err, docs){
              console.log(JSON.stringify(docs));
               res.send(JSON.stringify(docs));
            });
         });
          
        });
});
        
app.listen(3000);
console.log('Listening on port 3000');