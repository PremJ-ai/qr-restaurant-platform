import express from "express";import cors from "cors";import {randomUUID} from "node:crypto";
const app=express();app.use(cors());app.use(express.json({limit:"1mb"}));const orders=new Map(),keys=new Map();
const validStates=["NEW","ACCEPTED","PREPARING","READY","COMPLETED","CANCELLED"];const next={NEW:["ACCEPTED","CANCELLED"],ACCEPTED:["PREPARING","CANCELLED"],PREPARING:["READY"],READY:["COMPLETED"]};
function total(items=[]){return items.reduce((s,x)=>s+Math.max(0,Number(x.unitPrice||0))*Math.max(1,Number(x.quantity||1)),0)}
app.get("/api/v1/health",(_,res)=>res.json({ok:true,service:"node-api",time:new Date().toISOString()}));
app.get("/api/v1/orders",(_,res)=>res.json([...orders.values()]));
app.post("/api/v1/orders",(req,res)=>{
 const idem=req.get("Idempotency-Key")||req.body?.idempotencyKey;
 if(idem&&keys.has(idem))return res.json(keys.get(idem));
 const b=req.body||{};if(!b.tableNumber||!b.customer?.name||!b.customer?.phone||!Array.isArray(b.items)||!b.items.length)return res.status(400).json({message:"Invalid order"});
 const order={orderId:"QR-"+Date.now().toString().slice(-8),idempotencyKey:idem||randomUUID(),tableNumber:String(b.tableNumber),customer:{name:String(b.customer.name).trim(),phone:String(b.customer.phone).trim()},dietaryPreference:b.dietaryPreference||null,specialInstructions:b.specialInstructions||null,items:b.items.map(x=>({name:String(x.name),quantity:Math.min(10,Math.max(1,Number(x.quantity)||1)),unitPrice:Number(x.unitPrice)||0,customizations:Array.isArray(x.customizations)?x.customizations.map(String):[]})),total:total(b.items),status:"NEW",createdAt:new Date().toISOString()};
 orders.set(order.orderId,order);if(idem)keys.set(idem,order);res.status(201).json(order);
});
app.patch("/api/v1/orders/:id/status",(req,res)=>{const o=orders.get(req.params.id);if(!o)return res.status(404).json({message:"Order not found"});const s=req.body?.status;if(!validStates.includes(s)||(!(next[o.status]||[]).includes(s)))return res.status(409).json({message:"Invalid state transition"});o.status=s;orders.set(o.orderId,o);res.json(o)});
app.listen(process.env.PORT||4000,()=>console.log("Node API listening on",process.env.PORT||4000));