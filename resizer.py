#!env python3
from PIL import Image, ImageOps, ImageDraw
import requests, json, threading, math
from queue import Queue
from io import BytesIO

NUM_THREADS = 16
NRDB_URL = "http://netrunnerdb.com"
OUTPUT_FOLDER = "./thumbs/"

crops = {
        "Agenda":(59, 43, 270, 226),
        "Asset":(44, 12, 256, 195),
        "Corp":(22, 69, 277, 290),
        "Event":(41, 43, 258, 230),
        "Hardware":(42, 17, 258, 205),
        "ICE":(63, 218, 238, 419),
        "Operation":(44, 48, 255, 231),
        "Program":(70, 25, 238, 171),
        "Resource":(71, 34, 230, 171),
        "Runner":(27, 55, 274, 269),
        "Upgrade":(31, 0, 271, 209),
        }

q = Queue()

def worker ():
    while True:
        card = q.get()

        if card["type"] == "Identity":
            crop = crops[card["side"]]
        else:
            crop = crops[card["type"]]

        res = requests.get(NRDB_URL + card["imagesrc"])
        im = Image.open(BytesIO(res.content))
        im = im.crop(crop)

        if card["type"] == "ICE":
            im = im.transpose(Image.ROTATE_270)

        mask = Image.new("L", (im.width * 3, im.height * 3), 0)
        hexagon = [
                (0, mask.height / 2),
                (mask.width / 4, 0),
                (mask.width / 4 * 3, 0),
                (mask.width, mask.height / 2),
                (mask.width / 4 * 3, mask.height),
                (mask.width / 4, mask.height)]
        maskdraw = ImageDraw.Draw(mask)
        maskdraw.polygon(hexagon, fill = 255);
        mask = mask.resize(im.size, Image.ANTIALIAS)

        output = Image.new("RGBA", (im.width, im.width), color = (255, 255, 255, 0))
        output.paste(im,
            box = (0, round((1 - (math.sqrt(3)/2)) / 2 * im.width)),
            mask = mask)

        output.save(OUTPUT_FOLDER + card["code"] + ".png", compress_level=9)
        q.task_done()
        print(threading.current_thread().name + ":\t" + card["title"] + " processed")

def main ():
    print("Fetching card list")
    res = requests.get(NRDB_URL + "/api/cards")
    cards = res.json()

    print("Spawning threads")
    for i in range(NUM_THREADS):
        t = threading.Thread(target=worker, name="Thread " + str(i))
        t.daemon = True
        t.start()

    print("Populating queue")
    for card in cards:
        q.put(card)

    q.join()
    print("Task complete")

if __name__ == "__main__":
    main()

