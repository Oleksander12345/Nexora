from pathlib import Path
from PIL import Image
source=Image.open('docs/reference.png').convert('RGB')
out=Path('public/images')
# Tight source photography crops exclude the mockup's editable labels and controls.
products={
'flow':(151,494,284,608),'pulse':(360,494,481,608),'beam':(540,498,707,608),
'fold':(774,480,870,608),'drift':(1002,477,1086,608),'daily':(1169,477,1299,608),
'air':(131,905,210,983),'vista':(328,905,414,983),'glow':(532,903,619,987),
'volt':(732,902,819,987),'nest':(936,904,1024,987),'clear':(1139,904,1224,987),
'home':(374,333,439,392),'gift':(1135,332,1194,391)}
for name,box in products.items(): source.crop(box).save(out/f'{name}.webp','WEBP',quality=95)
for name,x in [('audio',243),('home',369),('wearables',495),('phone',621),('bags',747),('workspace',873),('lifestyle',999),('gifts',1125)]:
    source.crop((x,320,x+79,399)).save(out/f'cat-{name}.webp','WEBP',quality=95)
