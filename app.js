const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const Joi = require('joi');

const db = require("./db");
const collection = "hotel";
const app = express();

// shema koristena za validaciju
const schema = Joi.object().keys({
    hotel_ime : Joi.string().required(),
    hotel_sobe: Joi.string(),
    hotel_zvjezdice: Joi.string(),
    hotel_kapacitet: Joi.string(),
    hotel_lokacija: Joi.string()
});

// parsira json poslan od korisnika
app.use(bodyParser.json());

// salje html korisniku
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'index.html'));
});

// read
app.get('/gethotels',(req,res)=>{
    // uzmi sve hotel "dokumente" u hotel kolekciji
    // posalji nazad kao json
    db.getDB().collection(collection).find({}).toArray((err,documents)=>{
        if(err)
            console.log(err);
        else{
            res.json(documents);
        }
    });
});

// update
app.put('/:id',(req,res)=>{
    // primarni kljuc iz baze koji zelimo updejtat
    const hotelID = req.params.id;
    // "dokument" koji updejtamo
    const userInput = req.body;
    console.log(userInput);
    // nadji po ID-u "dokument" i updejtaj
    db.getDB().collection(collection).findOneAndUpdate({_id : db.getPrimaryKey(hotelID)},
        {$set : {
                hotel_ime : userInput.hotel_ime,
                hotel_sobe: userInput.hotel_sobe,
                hotel_zvjezdice: userInput.hotel_zvjezdice,
                hotel_kapacitet: userInput.hotel_kapacitet,
                hotel_lokacija: userInput.hotel_lokacija
    }},{returnOriginal : false},(err,result)=>{
        if(err)
            console.log(err);
        else{
            res.json(result);
        }      
    });
});


//create
app.post('/',(req,res,next)=>{
    // "dokument" koji ce biti insertan
    const userInput = req.body;

    // validira dokument
    // ako nije dobar posalji error middlewaru
    // u suprotnom ubaci u bazu
    Joi.validate(userInput,schema,(err,result)=>{
        if(err){
            const error = new Error("Unos nije dobar.");
            error.status = 400;
            next(error);
        }
        else{
            db.getDB().collection(collection).insertOne(userInput,(err,result)=>{
                if(err){
                    const error = new Error("Error: Hotel nije dodan.");
                    error.status = 400;
                    next(error);
                }
                else
                    res.json({result : result, document : result.ops[0],msg : "Hotel uspjesno dodan!",error : null});
            });
        }
    })    
});



//delete
app.delete('/:id',(req,res)=>{
    // primarni kljuc hotel dokumenta
    const hotelID = req.params.id;
    // nadji dokument po idu i obrisi ga
    db.getDB().collection(collection).findOneAndDelete({_id : db.getPrimaryKey(hotelID)},(err,result)=>{
        if(err)
            console.log(err);
        else
            res.json(result);
    });
});

// Middleware za errore
// salje error res nazad korisniku
app.use((err,req,res,next)=>{
    res.status(err.status).json({
        error : {
            message : err.message
        }
    });
});


db.connect((err)=>{
    // ako je err ne moze se spojiti s bazom
    // zavrsi app
    if(err){
        console.log('unable to connect to database');
        process.exit(1);
    }
    // uspjesno spojeno sa db
    // pokreni Express App
    else{
        app.listen(3000,()=>{
            console.log('connected to database, app listening on port 3000');
        });
    }
});

