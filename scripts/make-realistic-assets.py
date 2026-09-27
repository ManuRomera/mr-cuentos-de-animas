#!/usr/bin/env python3
from PIL import Image, ImageEnhance, ImageFilter, ImageDraw, ImageFont, ImageOps
from pathlib import Path
import argparse

ap=argparse.ArgumentParser()
ap.add_argument("--table",required=True)
ap.add_argument("--sheet",required=True)
args=ap.parse_args()

ROOT=Path(__file__).resolve().parents[1]
cards=ROOT/"assets/cards"; branding=ROOT/"assets/branding"; counters=ROOT/"assets/counters"; docs=ROOT/"docs/assets"
for d in (cards,branding,counters,docs): d.mkdir(parents=True,exist_ok=True)

def save(im,path,q=88):
    if im.mode not in ("RGB","RGBA"): im=im.convert("RGB")
    im.save(path,"WEBP",quality=q,method=6)

def fit(im,size,centering=(.5,.5)):
    return ImageOps.fit(im,size,method=Image.Resampling.LANCZOS,centering=centering)

table_src=Image.open(args.table).convert("RGB")
table=fit(table_src,(1920,1080))
table=ImageEnhance.Color(ImageEnhance.Contrast(table).enhance(1.05)).enhance(.94)
save(table,branding/"table.webp",90)

cover=table.copy().convert("RGBA")
veil=Image.new("RGBA",cover.size,(0,0,0,72)); cover=Image.alpha_composite(cover,veil)
dr=ImageDraw.Draw(cover)
dr.rectangle((0,300,1920,800),fill=(4,3,3,100))
font_path="/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
try:
    title=ImageFont.truetype(font_path,98); small=ImageFont.truetype(font_path,28)
except: title=small=ImageFont.load_default()
for text,y,font,fill in [
    ("MR · CUENTOS DE ÁNIMAS",435,title,(234,217,183,255)),
    ("HISTORIAS PARA CONTAR CUANDO CAE LA NOCHE",570,small,(197,160,98,255))
]:
    bb=dr.textbbox((0,0),text,font=font); x=(1920-(bb[2]-bb[0]))//2
    dr.text((x+2,y+2),text,font=font,fill=(0,0,0,170)); dr.text((x,y),text,font=font,fill=fill)
save(cover,branding/"cover.webp",90)

sheet=Image.open(args.sheet).convert("RGB")
w,h=sheet.size
names=["back","clue","environment","character","incident","gray-1","gray-2","gray-3"]
panels={}
for idx,name in enumerate(names):
    col,row=idx%4,idx//4
    x0=round(col*w/4)+5; x1=round((col+1)*w/4)-5
    y0=round(row*h/2)+5; y1=round((row+1)*h/2)-5
    panel=fit(sheet.crop((x0,y0,x1,y1)),(900,1200))
    panel=ImageEnhance.Contrast(panel).enhance(1.04)
    panels[name]=panel
    save(panel,cards/f"{name}.webp",90)

# Physical-looking number cards on photographic environment art.
try:
    numfont=ImageFont.truetype(font_path,330); capfont=ImageFont.truetype(font_path,44)
except: numfont=capfont=ImageFont.load_default()
base=panels["environment"]
for n in range(1,11):
    im=base.copy().filter(ImageFilter.GaussianBlur(1)).convert("RGBA")
    im=Image.alpha_composite(im,Image.new("RGBA",im.size,(8,7,6,96)))
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((26,26,874,1174),28,outline=(185,143,72,220),width=6)
    d.rounded_rectangle((42,42,858,1158),22,outline=(230,205,160,100),width=2)
    ss=str(n); bb=d.textbbox((0,0),ss,font=numfont); tx=(900-(bb[2]-bb[0]))/2; ty=430-(bb[3]-bb[1])/2
    d.text((tx+4,ty+5),ss,font=numfont,fill=(0,0,0,190)); d.text((tx,ty),ss,font=numfont,fill=(238,220,185,255))
    label="CARTA NUMÉRICA"; bb=d.textbbox((0,0),label,font=capfont); tx=(900-(bb[2]-bb[0]))/2
    d.text((tx,960),label,font=capfont,fill=(212,183,130,220))
    save(im,cards/f"number-{n}.webp",89)
save(panels["back"],cards/"number-back.webp",90)

save(panels["clue"],branding/"scenario-voice.webp",90)
save(panels["environment"],branding/"scenario-house.webp",90)

# Resource counters are circular photographic crops from the generated table.
def token(cx,cy,r,name,cool=False,spent=False):
    W,H=table_src.size
    x=int(cx*W); y=int(cy*H); rr=int(r*min(W,H))
    crop=table_src.crop((x-rr,y-rr,x+rr,y+rr))
    crop=fit(crop,(256,256))
    if cool:
        R,G,B=crop.split(); crop=Image.merge("RGB",(R,G,B.point(lambda v:min(255,int(v*1.08)))))
    if spent:
        crop=ImageOps.grayscale(crop).convert("RGB"); crop=ImageEnhance.Brightness(crop).enhance(.43)
    rgba=crop.convert("RGBA")
    mask=Image.new("L",(256,256),0); ImageDraw.Draw(mask).ellipse((7,7,249,249),fill=255); rgba.putalpha(mask)
    save(rgba,counters/name,92)

# Prompt places moonstones left and amber right; relative crops keep this robust across regenerated tables.
token(.21,.44,.055,"spirit-on.webp",True,False)
token(.21,.44,.055,"spirit-off.webp",True,True)
token(.82,.49,.055,"determination-on.webp",False,False)
token(.82,.49,.055,"determination-off.webp",False,True)

# Repository showcase, built entirely from the generated photographic assets.
show=Image.new("RGB",(1600,900),(10,8,7))
show.paste(fit(table,(1600,900)),(0,0))
shade=Image.new("RGBA",(1600,900),(0,0,0,80)); show=Image.alpha_composite(show.convert("RGBA"),shade)
positions=[(65,110),(325,110),(585,110),(845,110),(1105,110)]
for img,(x,y) in zip([panels["back"],panels["clue"],panels["environment"],panels["character"],panels["gray-2"]],positions):
    thumb=fit(img,(220,300)); show.alpha_composite(thumb.convert("RGBA"),(x,y))
d=ImageDraw.Draw(show)
try: sf=ImageFont.truetype(font_path,66); sub=ImageFont.truetype(font_path,26)
except: sf=sub=ImageFont.load_default()
d.text((70,500),"MR · CUENTOS DE ÁNIMAS",font=sf,fill=(235,218,183,255))
d.text((74,585),"Mesa ritual · cartas fotográficas · Damas Grises · piedras y ámbar",font=sub,fill=(207,174,118,255))
save(show,branding/"showcase.webp",88)

save(table,docs/"table.webp",84); save(cover,docs/"cover.webp",84); save(panels["back"],docs/"card-back.webp",84)
print("Realistic WebP assets generated.")
