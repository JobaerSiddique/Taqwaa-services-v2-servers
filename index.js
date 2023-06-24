const express = require('express')
const app = express()
const port = 5000
const cors= require('cors')
const jwt = require('jsonwebtoken');
require('dotenv').config()

app.use(express.json())
app.use(cors())


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qc6crda.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qc6crda.mongodb.net/?retryWrites=true&w=majority`;

console.log(uri)
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const garagesCollection = client.db('taqwaa_service').collection('garages')
const usersCollection = client.db('taqwaa_service').collection('users')
const servicesCollection = client.db('taqwaa_service').collection('services')
const bookingsCollection = client.db('taqwaa_service').collection('booked')
 function verfiyJwt(req,res,next){
    const authHeader = req.headers.authorizaion
    if(!authHeader){
      return res.status(401).send('Unauthorized Acess')
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token,process.env.ACCESS_TOKEN,function(err, decoded){
      if(err){
        return res.status(403).send('forbidden access')
      }
      req.decoded=decoded
      next()
    })
 } 

async function run() {
    try {
     app.get('/garages',async(req,res)=>{  
      const locations=req.query.location;
    const services=req.query.service
      
     console.log(locations,services);
      if(locations){
      
          const query={location:locations,services:{$elemMatch:{name:services}}}
        console.log(query);
        const result= await garagesCollection.find(query).toArray()
        // res.send(result)
        console.log(result);
       
       return res.send(result)
      }
      const queries={}
      const service = await garagesCollection.find(queries).toArray()
      res.send(service)
      // console.log(query);
     
     
   
    
     }) 
     app.get('/garages/:id',async(req,res)=>{
        const id = req.params.id;
        const query={_id:new ObjectId(id)}
        const result = await garagesCollection.findOne(query)
        res.send(result)
     })
     app.delete('/garages/:id',async(req,res)=>{
        const id = req.params.id;
        const query={_id:new ObjectId(id)}
        const result = await garagesCollection.deleteOne(query)
        res.send(result)
     })

    //  set bookings
    app.get('/bookings',verfiyJwt, async(req,res)=>{
      const date=req.query.date
      
      console.log('token',req.headers.authorizaion)
      const query={}
      const options= await servicesCollection.find(query).toArray()
      const bookedDateQuery={date:date}
      
      const alreadyBooked= await bookingsCollection.find(bookedDateQuery).toArray()
     
     
      options.forEach(option=>{
        const optionsBooked= alreadyBooked.filter(book=>book.serviceName ===option.name)
        const bookedSlots= optionsBooked.map(book=>book.slot)
        const remainningSlots= option.slots.filter(slot=>!bookedSlots.includes(slot))
        option.slots=remainningSlots
        
      })
      res.send(options)
    })

    
    app.post('/booked',async(req,res)=>{
      const booking = req.body;
      const query={
        date:booking.date,
        providerName:booking.providerName,
        CustomerEmail:booking.CustomerEmail,
        serviceName:booking. serviceName
       }
       
      
       const alreadyBooked = await bookingsCollection.find(query).toArray()
       console.log(alreadyBooked)
       
       
      
       if(alreadyBooked.length){
        const message =`You Already booking on ${booking.serviceName} at ${booking.providerName}`
        return res.send({acknowledhed:false,message})
       }
      else{
        const result= await bookingsCollection.insertOne(booking)
      res.send(result)
      }
    })


    app.get('/booked',verfiyJwt,async(req,res)=>{
      const email=req.query.email
      const decodedEmail = req.decoded.email;
      console.log(email)
      // if(email !==decodedEmail){
      //   return res.status(403).send('Forbidden Access')
      // }
      //  else if(email){
      //   const query={CustomerEmail:email}
      //   const results = await bookingsCollection.find(query).toArray()
      //   res.send(results)
      //  }
       
       
      //   const queries={}
      //   const result = await bookingsCollection.find(queries).toArray()
      //   res.send(result)
      switch (email) {
        case email !== decodedEmail:
           res.status(403).send('Forbidden Access')
          break;
          case email:
            const query={CustomerEmail:email}
        const results = await bookingsCollection.find(query).toArray()
        res.send(results)
        break;
        

      
        default:
          const queries={}
        const result = await bookingsCollection.find(queries).toArray()
        res.send(result)
          break;
      }
       
    })

    app.get('/allOrders',verfiyJwt,async(req,res)=>{
      const queries={}
      const results = await bookingsCollection.find(queries).toArray()
      res.send(results)
    })

    app.delete('/booked/:id', async(req,res)=>{
      const id= req.params.id;
      const query = {_id:new ObjectId(id)}
      const deleteItems = await bookingsCollection.deleteOne(query)
      res.send(deleteItems)
    })

    app.get('/jwt',async(req,res)=>{
      const email=req.query.email;
      const query={email:email}
      const user= await usersCollection.findOne(query)
    if(user){
      const token= jwt.sign({email},process.env.ACCESS_TOKEN,{expiresIn:'1h'})
      return res.status(200).send({accessToken:token})
    }
    res.status(403).send({accessToken:''})
      
    })
   
    //  users informations
    app.post('/user',async(req,res)=>{
      const user=req.body;
      console.log(user)
      const query ={email:user.email}
      const createAt = new Date()
      const alreadyUser = await usersCollection.findOne(query)
      if(alreadyUser){
        return res.send({message:'user already Created'})
      }
      const result = await usersCollection.insertOne(user,createAt)
      res.send(result)
    })
    app.get('/user',verfiyJwt,async(req,res)=>{
      const query={}
      const result = await usersCollection.find(query).toArray()
      res.send(result)
    })

    app.put('/user/admin/:id',verfiyJwt, async(req,res)=>{
      const decodedEmail = req.decoded.email
      console.log(decodedEmail)
      const query={email:decodedEmail}
      const findUser= await usersCollection.findOne(query)
  console.log(findUser?.role)
      if(findUser?.role !=='Admin'){
        return res.status(403).send({message:'Forbidden Access'})
      }
  
      
        const id=req.params.id;
      const filter={_id: new ObjectId(id)}
      const options = { upsert: true };
      const updateDoc = {
        $set:{
          role:'Admin'
        }
      }

      const result= await usersCollection.updateOne(filter,updateDoc,options)
      res.send(result)  
    })

    // Garage update
    app.put('/user/admin/garage/:id',verfiyJwt, async(req,res)=>{
      const decodedEmail = req.decoded.email
      console.log(decodedEmail)
      const query={email:decodedEmail}
      const findUser= await usersCollection.findOne(query)
  console.log(findUser?.role)
      if(findUser?.role ==='Admin'){
        const id=req.params.id;
      const filter={_id: new ObjectId(id)}
      const options = { upsert: true };
      const updateDoc = {
        $set:{
          role:'Garage'
        }
      }

      const result= await usersCollection.updateOne(filter,updateDoc,options)
      return res.send(result)  
        
      }
  
      res.status(403).send({message:'Forbidden Access'})
        
    })

    app.get('/user/admin/:email',async(req,res)=>{
      const email=req.params.email;
      const query={email:email}
      const admin= await usersCollection.findOne(query)
      res.send({isAdmin:admin?.role === 'Admin'})
    })
    app.get('/user/admin/garage/:email',async(req,res)=>{
      const email=req.params.email;
      const query={email:email}
      const garage= await usersCollection.findOne(query)
      res.send({isGarage:garage?.role === 'Garage'})
    })
   
    } finally {
    //   await client.close();
    }
  }
  run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Taqwaa connected')
})

app.listen(port, () => {
  console.log(`taqwaa service Provider is connected ${port}`)
})