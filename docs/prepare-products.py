from PIL import Image,ImageChops
from pathlib import Path
names=['flow','pulse','beam','fold','drift','daily','air','vista','glow','volt','nest','clear']
for name in names:
    path=Path(f'docs/generated-products/{name}-v2.webp')
    if not path.exists(): continue
    im=Image.open(path).convert('RGBA')
    alpha=im.getchannel('A')
    transparent=alpha.getextrema()[0]<255
    if transparent:
        mask=alpha.point(lambda value: 255 if value>128 else 0)
        bg=(0,0,0,0)
    else:
        mask=im.convert('L').point(lambda value:255 if value<190 else 0)
        bg=im.getpixel((0,0))
    box=mask.getbbox()
    if not box: continue
    x0,y0,x1,y1=box
    pad=round(max(x1-x0,y1-y0)*.065)
    rect=(max(0,x0-pad),max(0,y0-pad),min(im.width,x1+pad),min(im.height,y1+pad))
    crop=im.crop(rect)
    ratio=192/135 if names.index(name)<6 else 1
    w=max(crop.width,round(crop.height*ratio))
    h=max(crop.height,round(crop.width/ratio))
    result=Image.new('RGBA',(w,h),bg)
    result.alpha_composite(crop,((w-crop.width)//2,(h-crop.height)//2))
    result.thumbnail((576,405) if names.index(name)<6 else (240,240),Image.Resampling.LANCZOS)
    result.save(f'public/images/{name}.webp','WEBP',quality=88)
    print(name,result.size)
