const express = require('express')
const app = express()
const port = 5000
const cors= require('cors')
const jwt = require('jsonwebtoken');
const SSLCommerzPayment = require('sslcommerz-lts')
const SSLCommerzPayment2 = require('sslcommerz-lts')
const { v4: uuidv4 } = require('uuid');
require('dotenv').config()
const nodemailer = require("nodemailer");
const mg = require('nodemailer-mailgun-transport');

app.use(express.json())
app.use(cors())
  
const auth = {
  auth: {
    api_key: process.env.STORE_API_KEY,
    domain: process.env.STORE_DOMAIN,
  }
}  
const transporter = nodemailer.createTransport(mg(auth));

const sendEmail=(payment)=>{
  transporter.sendMail({
    from: "jobaersiddique28me@gmail.com", // verified sender email
    to: payment.CustomerEmail, // recipient email
    subject: "Your Payment is Successfully Done", // Subject line
    text: "Hello world!", // plain text body
    html: `<div> <h1>Your Payment is Successfully Done</h1></div><br>
    <div><h2>Your transactionId : ${payment.transactionId}</h2> </div>
    <div> <p>Your ServiceProvider : ${payment.providerName}</p>
    <p>Your Service is : ${payment.serviceName}</p>
    <h3> Payment Time : ${payment.createdAt}</h3>
    <h3> Your Booking Id : ${payment._id}</h3>
    <p> Thanks For Using Taqwaa service Provider Web Site</p>
    <p> Please Tell me about Your Service at Review Section at Our Website</p>

    </div>
    
   
    
    `, // html body
  }, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}
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

const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASS
const is_live = false //true for live, false for sandbox

function store2 (){
  const storeid2=process.env.Store_key_New
const storePassword=process.env.store_pass_new
const is_live=false
console.log(storeid2,storePassword);
}

const garagesCollection = client.db('taqwaa_service').collection('garages')
const usersCollection = client.db('taqwaa_service').collection('users')
const servicesCollection = client.db('taqwaa_service').collection('services')
const bookingsCollection = client.db('taqwaa_service').collection('booked')
const paymentCollection = client.db('taqwaa_service').collection('payment')
const garagePaymentCollection = client.db('taqwaa_service').collection('Garagepayment')
const ratingCollection = client.db('taqwaa_service').collection('rating')
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
    app.post('/garages',async(req,res)=>{
      const query=req.body;
    
      const added = await garagesCollection.insertMany(query)
      res.send(added)
    })
     
      app.get('/garages',async(req,res)=>{  
      const locations=req.query.location;
    const services=req.query.service
    const email=req.query.email;
    console.log(email);
      
    if(email){
      const query={email:email}
      const filter = await garagesCollection.find(query).toArray()
      console.log('garage',filter);
      return res.send(filter)
      
    }
     console.log(locations,services);
      if(locations  ){
      
          const query={location:locations}
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

    //  garage pay
     
    
     app.get('/garagePayment',async(req,res)=>{
       const query={}
       const insert = await garagePaymentCollection.find(query).toArray()
       console.log(insert);
       res.send(insert)
     
     
       })
     app.get('/garagePayment/:id',async(req,res)=>{
       const ids=req.params.id
       const query={_id:new ObjectId(ids)}
       const insert = await garagePaymentCollection.findOne(query)
       console.log(insert);
       res.send(insert)
     
     
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

    // garage single order

    app.get('/garageOrder',async(req,res)=>{
      const providerName=req.query.providerName;
      if(providerName){
        const queries={providerName:providerName}
      const result= await bookingsCollection.find(queries).toArray()
      console.log(result);
      return res.send(result)
      }

    })

    app.get('/allOrders',verfiyJwt,async(req,res)=>{
      const queries={}
      const results = await bookingsCollection.find(queries).toArray()
      res.send(results)
    })


    // single booked order info
    app.get('/booked/:id',async(req,res)=>{
      const id =req.params.id
      const query={_id:new ObjectId(id)}
      const findItems = await bookingsCollection.findOne(query)
      console.log(findItems);
      res.send(findItems)
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

    app.delete('/user/:id',verfiyJwt,async(req,res)=>{
      const id=req.params.id
      const query={_id:new ObjectId(id)}
      const result = await usersCollection.deleteOne(query)
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


    // user rating
    app.post('/ratings',async(req,res)=>{
      const query=req.body;
      const result = await ratingCollection.insertOne(query)
      res.send(result)
    })
     app.get('/rating',async(req,res)=>{
      const query={}
      const result = await ratingCollection.find(query).toArray()
      res.send(result)
     })
    // payment Section
    const trans_id=new ObjectId().toString();
    app.post('/payment',async(req,res)=>{
    const{total_amount,cus_name,cus_email,phone,product_category,product_id}=req.body
    const productsDetails= await bookingsCollection.findOne({_id:new ObjectId(product_id)})
     
    console.log(productsDetails);
    const data = {
      total_amount: productsDetails.price ,
      currency: 'BDT',
      tran_id:  trans_id, // use unique tran_id for each api call
      success_url: `http://localhost:5000/payment/success/${trans_id}`,
      fail_url: `http://localhost:5000/payment/failed/${trans_id}`,
      cancel_url: 'http://localhost:3030/cancel',
      ipn_url: 'http://localhost:3030/ipn',
      shipping_method: 'Courier',
      product_name: 'Computer.',
      product_category: productsDetails.serviceName,
      product_profile: 'general',
      cus_name: productsDetails.CustomerName ,
      cus_email: productsDetails.CustomerEmail,
      cus_add1: 'Dhaka',
      cus_add2: 'Dhaka',
      cus_city: 'Dhaka',
      cus_state: 'Dhaka',
      cus_postcode: '1000',
      cus_country: 'Bangladesh',
      cus_phone: productsDetails.Phone,
      cus_fax: '01711111111',
      ship_name: 'Customer Name',
      ship_add1: 'Dhaka',
      ship_add2: 'Dhaka',
      ship_city: 'Dhaka',
      ship_state: 'Dhaka',
      ship_postcode: 1000,
      ship_country: 'Bangladesh',
      product_id:productsDetails._id
  };
  console.log('price',data);
  
  const sslcz = new SSLCommerzPayment(process.env.Store_key_New,process.env.store_pass_new,false)
  sslcz.init(data).then(apiResponse => {
      // Redirect the user to payment gateway
      let GatewayPageURL = apiResponse.GatewayPageURL
      // res.redirect(GatewayPageURL)
      res.send({url:GatewayPageURL})

     const query = {_id: new ObjectId(productsDetails._id)}
     const options = { upsert: true };
     const updateDoc = {
      $set:{
        paid:false,
        transactionId:trans_id,
        createdAt: new Date().toLocaleTimeString()
      }
    }
    const payment=  bookingsCollection.updateOne(query,updateDoc,options)
    
      console.log('Redirecting to: ', GatewayPageURL)
  });
    })

    app.post('/payment/success/:transId',async(req,res)=>{
      console.log(req.params.transId);
      const result = await bookingsCollection.updateOne({transactionId:req.params.transId},{
        $set:{
          paid:true,
        

        },
      })
      
      if(result.modifiedCount>0){
        const payment = await bookingsCollection.findOne({transactionId:req.params.transId})
        const allpayment= await paymentCollection.insertOne(payment)
        sendEmail(payment)
        res.redirect(`http://localhost:3000/payment/success/${req.params.transId}`)
      }
    })
    app.post('/payment/failed/:transId',async(req,res)=>{
      console.log(req.params.transId);
      const result = await bookingsCollection.updateOne({transactionId:req.params.transId},{
        $set:{
          paid:false,
        

        },
      })
      
      if(result.modifiedCount>0){
      
        res.redirect(`http://localhost:3000/payment/failed/${req.params.transId}`)
      }
    })
    app.get('/allpayment',async(req,res)=>{
      const services= await paymentCollection.estimatedDocumentCount()
      const users = await usersCollection.estimatedDocumentCount()
      const totalServices = await servicesCollection.estimatedDocumentCount()
      const totalGarage = await garagesCollection.estimatedDocumentCount()
    // res.send({
    //   services,
    //   users,
    //   totalServices,totalGarage
    // })
    
 
     const payment = await paymentCollection.aggregate([
      {
        $group:
          
          {
            _id: null,
            TotalPrice: {
              $sum: "$price",
            },
          },
      },
      
      
    ]).toArray()
    
     const wholepayment = await paymentCollection.aggregate([
     
      {
        
        $group:
          
          {
            _id: "$providerName",
            Totalprice: {
              $sum: `$price`,
            },
          },
      },{
        $project:{
        providerName:"$_id",
          Totalprice:1,
          reducePrice:{
            $subtract:[
              "$Totalprice",{
                $multiply:[
                  "$Totalprice",0.1
                ]
              }
            ]
          }
        }
      }
      
    ]).toArray()
    console.log(wholepayment,payment,services);
   
   
  
   
    // res.send(insertGarageInfo)
     res.send({wholepayment,payment,users,totalGarage,services})
      
    })

  app.get('/garageGive',async(req,res)=>{
    const result = await garagePaymentCollection.find({}).toArray()
    res.send(result)
  })

    // garage Payment
    const tran_id=new ObjectId().toString()
  app.post('/garagePay',async(req,res)=>{
    const {price,garageName,_id}=req.body 
   console.log(garageName,price,_id);
   
   
    const data = {
        total_amount:price ,
        currency: 'BDT',
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `http://localhost:5000/payment/garage/success/${tran_id}`,
        fail_url: `http://localhost:5000/payment/garage/failed/${tran_id}`,
        cancel_url: 'http://localhost:3030/cancel',
        ipn_url: 'http://localhost:3030/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: garageName,
        cus_email: 'customer@example.com',
        cus_add1: 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: '01711111111',
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
    };

    const sslcz = new SSLCommerzPayment2(process.env.STORE_ID,process.env.STORE_PASS,false)
    sslcz.init(data).then(apiResponse => {
     // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL
        res.send({url:GatewayPageURL})
        const query={_id:new ObjectId(_id)}
        const options = { upsert: true };
     const updateDoc = {
      $set:{
        paid:false,
        transactionId:tran_id,
        createdAt: new Date().toLocaleTimeString()
      }
    }
    const payment = garagePaymentCollection.updateOne(query,updateDoc,options)
        console.log('Redirecting to: ', GatewayPageURL)
    });
  })
  
  app.post('/payment/garage/success/:tranId',async(req,res)=>{
    console.log(req.params.tranId);
    
    res.redirect(`http://localhost:3000/dashboard/garage/payment/success/${req.params.tranId}`)
  })
  app.post('/payment/garage/failed/:tranId',async(req,res)=>{
    console.log(req.params.tranId);
    res.redirect(`http://localhost:3000/garage/payment/failed/${req.params.tranId}`)
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