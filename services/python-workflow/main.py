from fastapi import FastAPI,HTTPException
from pydantic import BaseModel
app=FastAPI(title="QR Restaurant Python Workflow")
ALLOWED={"NEW":{"ACCEPTED","CANCELLED"},"ACCEPTED":{"PREPARING","CANCELLED"},"PREPARING":{"READY"},"READY":{"COMPLETED"},"COMPLETED":set(),"CANCELLED":set()}
class Transition(BaseModel):
    current:str
    target:str
@app.get("/health")
def health(): return {"ok":True,"service":"python-workflow"}
@app.post("/workflow/transition")
def transition(body:Transition):
    if body.target not in ALLOWED.get(body.current,set()):
        raise HTTPException(409,"Invalid workflow transition")
    return {"ok":True,"from":body.current,"to":body.target}
@app.post("/workflow/eta")
def eta(items:int=1):
    items=max(1,min(items,20))
    return {"estimated_minutes":max(8,5+items*4)}