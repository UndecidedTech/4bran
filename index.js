require("dotenv").config();
const express = require("express");
const fs = require("fs");
const schedule = require("node-schedule");
const multer = require("multer");
const cors = require("cors");
const sizeOf = require("image-size");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const db_user = process.env.DB_USER;
const db_pass = process.env.DB_PASS;
const db_ip = process.env.DB_IP
const url = `mongodb://${db_user}:${db_pass}@${db_ip}/4Bran?authSource=admin`
const getDimensions = require("get-video-dimensions")

// is this the best way to do it?

let JSONthread = fs.readFileSync("post.json");


let storedThread = JSON.parse(JSONthread);


function writePostNumber() {
    storedThread.postNumber++
    fs.writeFileSync("post.json", JSON.stringify(storedThread))
    return storedThread.postNumber
}


const Board = require("./models/board");
const Banner =  require("./models/banner")


mongoose.connect(url, {useNewUrlParser:true, useUnifiedTopology: true, useFindAndModify: false});

// rate limiters
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200
});
//change postlimit back
const postLimit = rateLimit({
    windowMs: 1000 * 60 * 5,
    max: 100
})

const replyLimit = rateLimit({
    windowsMs: 1000 * 30,
    max: 5
})

const app = express();
const port = process.env.PORT || 3000;

// {"postNumber":"0","image":"","title":"","content":"","replies":[]}

app.use(limiter);

app.use(cors({
    "origin": ["http://localhost:8080"],
    "credentials": true,
    "methods": ["GET", "POST", "OPTIONS"]
}));

app.use(express.json());

app.use("/image", express.static("image"));

app.use("/", express.static("./public"));

const fileFilter = (req, file, cb) => {
    console.log(file.mimetype)
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/gif" || file.mimetype === "video/webm" || file.mimetype === "image/jpeg"){
        cb(null, true)
    } else {
        cb(null, false)
    }
}

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./image/");
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString() + file.originalname);
    }
})

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

app.listen(port, () => console.log(`server started on ${port}`))

app.post("/api/thread", postLimit, upload.single("image"), async (req, res) => {
    if (req.file !== undefined) {
        let thread = {};
        let img = sizeOf(req.file.path);
        let returnValue = {
            "nWidth": img.width,
            "nHeight": img.height
        };

        if (img.width > img.height) {
            let pWidth = 250;
            let cWidth = 150;
            let percentChange = ((pWidth - img.width) / Math.abs(img.width));
            let catalogChange = ((cWidth - img.width) / Math.abs(img.width));
               
            returnValue.pWidth = 250;
            returnValue.cWidth = 150;
            returnValue.cHeight = img.height - Math.abs(img.height * catalogChange);
            returnValue.pHeight = img.height - Math.abs(img.height * percentChange);
                
            returnValue.width = 250;
            returnValue.height = returnValue.pHeight;
        } else {
            let pHeight = 250;
            let cHeight = 150;
            let percentChange = (pHeight - img.height) / Math.abs(img.height);
            let catalogChange = (cHeight - img.height) / Math.abs(img.height);

            returnValue.pHeight = 250;
            returnValue.cHeight = 150;
            returnValue.pWidth = img.width - Math.abs(img.width * percentChange);
            returnValue.cWidth = img.width - Math.abs(img.width * catalogChange);


            returnValue.height = 250;
            returnValue.width = returnValue.pWidth;
        }

        thread.image = {
            "path": req.file.path,
            "size": returnValue,
            "kbSize": Math.ceil(req.file.size / 1000),
            "expanded": false
        }; 
        thread.postNumber = writePostNumber();
        thread.title = req.body.title;
        thread.content = req.body.content;
        thread.ip = await userIP(req);
        // Check Board & of threads and remove last bump if 40
        let board = await Board.findOne({"name": req.body.board })
        console.log(board.threads.sort((a,b) => (a.bumpDate > b.bumpDate) ? -1 : 1))
        if (board.threads.length >= 40) {
            //delete last thread bumpDate
            board.threads = await board.threads.sort((a,b) => (a.bumpDate > b.bumpDate) ? -1 : 1)
            board.threads = board.threads.splice(0, 30)
            await board.save();
            console.log(board.threads);
            
        }
        // write to Board thread list
        let newThread = await Board.findOneAndUpdate({"name": req.body.board}, {$push: { "threads": thread}});
        // update bumpDate

        res.status(200).send("Success");   
    }      
});

app.get("/api/board/:boardName", async (req, res) => {
    let returnValue = await Board.findOne({"name": req.params.boardName});
    returnValue.threads = await returnValue.threads.sort((a,b) => (a.bumpDate > b.bumpDate) ? -1 : 1)
    console.log(req.connection.remoteAddress, console.log(req.ip));

    if (req.connection.remoteAddress) {
        let ip = req.connection.remoteAddress.substr(7);
        returnValue.ip = ip;
        console.log(ip)
    }

    res.send(returnValue);
})


app.get("/api/thread/", async (req, res) => {
    let threadNumber = Number(req.query.threadNumber);
    let board = req.query.board;
    
    let threadReturn = await Board.findOne({"name": board})
        .where("threads.postNumber").equals(threadNumber)
        .lean();

    let returnValue = threadReturn.threads.find(thread => {
        if (thread.postNumber === threadNumber) {
            return thread
        }
    })
    
    if (req.connection.remoteAddress) {
        let ip = req.connection.remoteAddress.substr(7);
        returnValue.ip = ip;
        console.log(ip)
    }

    res.send(returnValue);
});

app.post("/api/thread/reply", replyLimit,upload.single("image"), async (req, res) => {
    let board = req.body.board;
    let comment = req.body.comment;
    let threadNumber = req.body.threadNumber;
    let postNumber = writePostNumber()

    if (req.file !== undefined) {
        let reply = {};
        
        console.log(req.file.mimetype)
        if (req.file.mimetype === "image/jpeg" || req.file.mimetype === "image/jpg" || req.file.mimetype === "image/png" || req.file.mimetype === "image/gif") {

            let img = sizeOf(req.file.path);
            let returnValue = {
                "nWidth": img.width,
                "nHeight": img.height
            };
    
            if (img.width > img.height) {
                let pWidth = 125;
                let percentChange = ((pWidth - img.width) / Math.abs(img.width));
                   
                returnValue.pWidth = pWidth;
                returnValue.pHeight = img.height - Math.abs(img.height * percentChange);
                    
                returnValue.width = 125;
                returnValue.height = returnValue.pHeight;
            } else {
                let pHeight = 125;
                let percentChange = (pHeight - img.height) / Math.abs(img.height);
    
                returnValue.pHeight = 125;
                returnValue.pWidth = img.width - Math.abs(img.width * percentChange);
                returnValue.height = 125;
                returnValue.width = returnValue.pWidth;
            }


            reply.image = {
                "path": req.file.path,
                "size": returnValue || undefined,
                "kbSize": Math.ceil(req.file.size / 1000),
                "expanded": false,
                "type": "image"
            };

        } else if (req.file.mimetype === "video/webm") {
            reply.image = {
                "path": req.file.path,
                "kbSize": Math.ceil(req.file.size / 1000),
                "expanded": false,
                "type": "webm"
            }
        }
        reply.ip = await userIP(req);

        
        
        reply.comment = req.body.comment;
        //temp placeholder
        reply.postNumber = postNumber;
        //write to DB document
        let replyUpdate = await Board.findOneAndUpdate({"name": board, "threads.postNumber": threadNumber}, {$push: {"threads.$.replies": reply}, $set: {"threads.$.bumpDate": Date.now()}}, {new: true});
        res.status(200).send(replyUpdate);   
    } else if (req.file === undefined) {
        let reply = {};
        reply.image = undefined;
        reply.comment = comment;
        reply.postNumber = postNumber;
        reply.ip = await userIP(req);

        console.log(reply);

        let replyUpdate = await Board.findOneAndUpdate({"name": board, "threads.postNumber": threadNumber}, {$push: {"threads.$.replies": reply}, $set: {"bumpDate": Date.now()}}, {new: true});
        res.send(replyUpdate)
    }
})

app.get("/api/banner", async (req, res) => {
    let boardName = req.body.board;
    
    let boards = ["a"];
    let randomBoard = boards[Math.floor(Math.random() * boards.length)];

    // change this to filter out boards from the requested Board
    let bannerList = await Banner.find()
        .where("board").equals(randomBoard);

    let result = bannerList[Math.floor(Math.random() * bannerList.length)];
    res.send(result);
})

async function userIP(req) {
    if (req.connection.remoteAddress === "::1") {
        let ip = "127.0.0.1"
        return ip
    } else {
        let ip = req.connection.remoteAddress;
        return ip
    }
}