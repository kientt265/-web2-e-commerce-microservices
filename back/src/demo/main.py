from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Demo Microservice")


class Item(BaseModel):
    id: int
    name: str
    description: str = None


# In-memory "database"
items = {
    1: Item(id=1, name="Item One", description="This is the first item"),
    2: Item(id=2, name="Item Two", description="This is the second item"),
    3: Item(id=3, name="Item Three", description="This is the third item"),
}


@app.post("/items/", response_model=Item)
def create_item(item: Item):
    items[item.id] = item
    return item


@app.get("/items/{item_id}", response_model=Item)
def read_item(item_id: int):
    item = items.get(item_id)
    if not item:
        return {"error": "Item not found"}
    return item


@app.get("/health")
def health_check():
    return {"status": "ok"}
