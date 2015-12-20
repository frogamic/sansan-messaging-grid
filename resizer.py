#!env python3
from PIL import Image, ImageOps
import requests, json, threading
from queue import Queue
from io import BytesIO

NUM_THREADS = 8

crops = {
        "Agenda":(59, 29, 270, 240),
        "Asset":(49, 0, 251, 202),
        "Corp":(22, 52, 277, 307),
        "Event":(41, 28, 258, 245),
        "Hardware":(42, 3, 258, 219),
        "ICE":(48, 209, 266, 427),
        "Operation":(44, 34, 255, 245),
        "Program":(73, 14, 241, 182),
        "Resource":(71, 23, 230, 182),
        "Runner":(29, 50, 269, 290),
        "Upgrade":(43, -6, 248, 208),
        }

pointytop = ["ICE", "Asset"]

maskf = Image.open("./flattophex.png").convert('L')
maskp = Image.open("./pointytophex.png").convert('L')

q = Queue()

def worker ():
    while True:
        card = q.get()
        if card["type"] in pointytop:
            mask = maskp
        else:
            mask = maskf

        if card["type"] == "Identity":
            crop = crops[card["side"]]
            if card["side"] == "Runner":
                mask = maskp
        else:
            crop = crops[card["type"]]

        res = requests.get("http://netrunnerdb.com" + card["imagesrc"])
        im = Image.open(BytesIO(res.content))
        im = im.crop(crop)
        im = im.resize((75, 75), Image.ANTIALIAS)

        if card["type"] == "ICE":
            im = im.transpose(Image.ROTATE_270)

        output = ImageOps.fit(im, mask.size, Image.ANTIALIAS, centering=(0.5, 0.5))
        output.putalpha(mask)
        output = output.crop(output.getbbox())

        output.save("./thumbs/" + card["code"] + ".png")
        q.task_done()

def main ():
    res = requests.get("http://netrunnerdb.com/api/cards")
    cards = res.json()

    for i in range(NUM_THREADS):
        t = threading.Thread(target=worker)
        t.daemon = True
        t.start()

    for card in cards:
        q.put(card)

    q.join()

if __name__ == "__main__":
    main()

