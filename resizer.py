#!env python3
from PIL import Image, ImageOps, ImageDraw
import requests, json, threading, math
from queue import Queue
from io import BytesIO

NUM_THREADS = 24
NRDB_URL = "http://netrunnerdb.com"
IMG_DIR = "/card_image/"
OUTPUT_FOLDER = "./thumbs/"

crops = {
        "agenda":(59, 43, 270, 226),
        "asset":(44, 12, 256, 195),
        "corp":(22, 69, 277, 290),
        "event":(41, 43, 258, 230),
        "hardware":(42, 17, 258, 205),
        "ice":(63, 218, 238, 419),
        "operation":(44, 48, 255, 231),
        "program":(70, 25, 238, 171),
        "resource":(71, 34, 230, 171),
        "runner":(27, 55, 274, 269),
        "upgrade":(31, 0, 271, 209),
        }

q = Queue()

def worker ():
    while True:
        card = q.get()

        if card["type_code"] == "identity":
            crop = crops[card["side_code"]]
        else:
            crop = crops[card["type_code"]]

        res = requests.get(NRDB_URL + IMG_DIR + card["code"] + ".png")
        print(threading.current_thread().name + ":\t" + card["code"] + " fetched " + str(res.status_code))
        if res.ok:
            im = Image.open(BytesIO(res.content))
            im = im.crop(crop)

            if card["type_code"] == "ice":
                im = im.transpose(Image.ROTATE_270)

            im.width, im.height = im.size
            mask = Image.new("L", (im.width * 3, im.height * 3), 0)
            mask.width, mask.height = mask.size
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
            print(threading.current_thread().name + ":\t" + card["title"] + " processed")

        q.task_done()

def main ():
    print("Fetching card list")
    res = requests.get(NRDB_URL + "/api/2.0/public/cards")
    print(res)
    cards = res.json()["data"]

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

