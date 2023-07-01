from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

app = FastAPI()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: object):
        for connection in self.active_connections:
            await connection.send_json(message)


manager = ConnectionManager()

class Body(BaseModel):#define request body
    id:int
    x:float
    y:float
    angle:float

@app.get("/")
async def get():
    await manager.broadcast({"id": 1, "x": 0, "y": 0, "angle": 0})
    return {"msg": "Hello World"}

@app.post("/api") 
async def post(body:Body): #recieve data
    await manager.broadcast(body.dict()) #broadcast data
    return body.dict()



@app.websocket("/socket")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"You wrote: {data}", websocket)
            await manager.broadcast(f"Client says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client left the chat")
