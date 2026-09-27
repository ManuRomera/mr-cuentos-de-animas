from pathlib import Path
import html, math
ROOT=Path('/mnt/data/mr-cuentos-de-animas')
for d in ['assets/branding','assets/cards','assets/counters']:
    (ROOT/d).mkdir(parents=True,exist_ok=True)

def write(rel, s):
    p=ROOT/rel; p.parent.mkdir(parents=True,exist_ok=True); p.write_text(s,encoding='utf-8')

def defs():
    return '''<defs>
  <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eadfca"/><stop offset=".55" stop-color="#cdbb9b"/><stop offset="1" stop-color="#a58d69"/></linearGradient>
  <radialGradient id="inkfade"><stop stop-color="#3d352b" stop-opacity=".18"/><stop offset="1" stop-color="#11100f" stop-opacity="0"/></radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e5c879"/><stop offset=".5" stop-color="#9a7134"/><stop offset="1" stop-color="#5e431e"/></linearGradient>
  <filter id="shadow"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity=".55"/></filter>
  <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="7" result="n"/><feBlend in="SourceGraphic" in2="n" mode="multiply"/></filter>
  <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><path d="M0 1h9" stroke="#231f1b" stroke-opacity=".08" stroke-width="1"/></pattern>
</defs>'''

def card_base(accent='#715a38', dark='#171512', title='PISTA', symbol='◇', extra=''):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 744 1039">
{defs()}
<rect width="744" height="1039" rx="42" fill="#11100f"/>
<rect x="18" y="18" width="708" height="1003" rx="34" fill="url(#paper)"/>
<rect x="36" y="36" width="672" height="967" rx="24" fill="url(#hatch)" stroke="{accent}" stroke-width="5"/>
<path d="M70 92 Q372 30 674 92 M70 947 Q372 1009 674 947" fill="none" stroke="{accent}" stroke-width="4" opacity=".8"/>
<path d="M85 122h574M85 917h574" stroke="#2a241d" stroke-width="1.8" opacity=".55"/>
<circle cx="372" cy="483" r="252" fill="url(#inkfade)"/>
<text x="372" y="122" text-anchor="middle" font-family="Georgia,serif" font-size="29" letter-spacing="9" fill="#2b251e">{html.escape(title)}</text>
<text x="372" y="885" text-anchor="middle" font-family="Georgia,serif" font-size="20" letter-spacing="5" fill="#453a2c">CUENTOS DE ÁNIMAS</text>
<text x="372" y="965" text-anchor="middle" font-family="Georgia,serif" font-size="45" fill="{accent}">{symbol}</text>
{extra}</svg>'''

# Back
extra='''<g transform="translate(372 485)" fill="none" stroke="#2b251e" stroke-width="5">
<circle r="230"/><circle r="190" stroke-width="2"/><circle r="146" stroke-width="2"/>
<path d="M0-206C-68-128-79-61-36 7-96 56-102 130-34 202M0-206C68-128 79-61 36 7 96 56 102 130 34 202"/>
<path d="M-168-116C-70-130-28-87 0-22 28-87 70-130 168-116M-172 119C-81 137-26 83 0 25 26 83 81 137 172 119"/>
<path d="M0-132c-54 43-73 99-39 154 12 20 26 31 39 43 13-12 27-23 39-43 34-55 15-111-39-154z" fill="#2b251e" opacity=".16"/>
<path d="M0-96c-29 30-39 67-18 101 6 11 12 17 18 23 6-6 12-12 18-23 21-34 11-71-18-101z" fill="none"/>
</g>'''
write('assets/cards/back.svg', card_base('#765d38','#171512','', '✦', extra))

# Card family illustrations
clue='''<g transform="translate(372 486)" fill="none" stroke="#2b251e" stroke-linecap="round" stroke-linejoin="round">
<circle r="192" stroke-width="2" opacity=".38"/><path d="M-112 80L40-72l66 66L-46 146z" stroke-width="10"/><circle cx="74" cy="-39" r="28" stroke-width="10"/><path d="M-98 66l42 42M-62 29l42 42" stroke-width="7"/><path d="M-152-92c69-58 137-76 204-54" stroke-width="3" opacity=".55"/></g>'''
environment='''<g transform="translate(372 490)" fill="none" stroke="#2b251e" stroke-linecap="round">
<path d="M-232 147C-146 35-96-80-128-215M-128-215c56 71 66 155 25 252M-128-123l-88-68M-119-74l93-112M103 157C68 28 93-83 160-194M147-167l-85-43M131-114l92-59M116-54l-79-43" stroke-width="9"/>
<path d="M-260 176c86-62 176-69 270-20 83-45 166-37 250 24" stroke-width="5"/><path d="M-212 25C-101-8 29-8 213 26" stroke-width="3" opacity=".4"/></g>'''
character='''<g transform="translate(372 477)" fill="none" stroke="#2b251e" stroke-linecap="round" stroke-linejoin="round">
<path d="M0-214c-88 0-142 68-142 158 0 56 22 92 54 123 22 21 31 59 33 118h110c2-59 11-97 33-118 32-31 54-67 54-123 0-90-54-158-142-158z" stroke-width="8"/>
<path d="M-84-44c27-20 56-20 84 0 28-20 57-20 84 0M-62 34c19 15 40 18 62 4 22 14 43 11 62-4" stroke-width="5"/><path d="M0-181v320" stroke-width="2" opacity=".34"/><circle cx="-48" cy="-39" r="5" fill="#2b251e"/><circle cx="48" cy="-39" r="5" fill="#2b251e"/></g>'''
incident='''<g transform="translate(372 487)" fill="none" stroke="#2b251e" stroke-linejoin="round">
<circle r="205" stroke-width="2" opacity=".3"/><path d="M-23-215L-132 20l95-8-36 210L132-38l-102 7z" stroke-width="10"/><path d="M-194-116l73 44M191-105l-76 40M-199 124l83-40M200 127l-86-44" stroke-width="4" opacity=".56"/></g>'''
write('assets/cards/clue.svg', card_base('#687251', title='PISTA', symbol='◆', extra=clue))
write('assets/cards/environment.svg', card_base('#5b6652', title='OBSTÁCULO · ENTORNO', symbol='⌁', extra=environment))
write('assets/cards/character.svg', card_base('#7b4b48', title='OBSTÁCULO · PERSONAJE', symbol='◉', extra=character))
write('assets/cards/incident.svg', card_base('#8a6339', title='PERCANCE', symbol='✦', extra=incident))

# Gray ladies
for i in range(1,4):
    veil_op=.18+.12*i
    eyes = '' if i<2 else '<circle cx="-33" cy="-47" r="7" fill="#e9e7df"/><circle cx="33" cy="-47" r="7" fill="#e9e7df"/>'
    extra=f'''<g transform="translate(372 498)" filter="url(#shadow)">
<path d="M0-245c-91 43-145 137-137 239 7 88-44 164-103 230h480c-59-66-110-142-103-230 8-102-46-196-137-239z" fill="#33383a" opacity=".92"/>
<path d="M0-198c-70 39-101 112-91 182 10 70-19 125-56 172h294c-37-47-66-102-56-172 10-70-21-143-91-182z" fill="#c7c9c7" opacity="{veil_op}"/>
<ellipse cx="0" cy="-54" rx="72" ry="99" fill="#151717" opacity=".92"/>{eyes}
<path d="M-112 166C-55 93-27 17 0-78 27 17 55 93 112 166" fill="none" stroke="#d9dad5" stroke-opacity=".55" stroke-width="5"/>
</g><text x="372" y="778" text-anchor="middle" font-family="Georgia,serif" font-size="70" fill="#4d5355">{['I','II','III'][i-1]}</text>'''
    write(f'assets/cards/gray-{i}.svg', card_base('#62696b', title=f'DAMA GRIS · {i}', symbol='☾', extra=extra))

# Number cards
write('assets/cards/number-back.svg', card_base('#5a4730', title='DESTINO', symbol='✧', extra='''<g transform="translate(372 492)" fill="none" stroke="#2b251e"><circle r="190" stroke-width="6"/><path d="M0-160L48-48 160 0 48 48 0 160-48 48-160 0-48-48z" stroke-width="7"/><circle r="44" stroke-width="6"/></g>'''))
for n in range(1,11):
    rays=''.join(f'<path d="M0-190V-235" transform="rotate({k*36})"/>' for k in range(10))
    extra=f'''<g transform="translate(372 490)" fill="none" stroke="#2b251e" stroke-linecap="round"><circle r="207" stroke-width="2" opacity=".4"/><circle r="166" stroke-width="5"/>{rays}</g>
<text x="372" y="610" text-anchor="middle" font-family="Georgia,serif" font-size="300" font-weight="bold" fill="#2a241d">{n}</text>'''
    write(f'assets/cards/number-{n}.svg', card_base('#6f5835', title='CARTA NUMÉRICA', symbol='✧', extra=extra))

# Counters
stone='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><radialGradient id="s" cx="34%" cy="28%"><stop stop-color="#f6ffff"/><stop offset=".28" stop-color="#b9dfe2"/><stop offset=".65" stop-color="#6e9ca7"/><stop offset="1" stop-color="#263e48"/></radialGradient><filter id="g"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M33 132C31 73 70 30 128 28c62-2 102 44 96 105-5 58-43 98-101 96-55-2-88-42-90-97z" fill="url(#s)" stroke="#c9edf0" stroke-width="7" filter="url(#g)"/><path d="M72 75c18-19 40-27 67-25-18 5-35 16-49 32-8 9-15 19-21 30-5-13-4-25 3-37z" fill="#fff" opacity=".38"/><path d="M75 174c28 20 66 25 99 3" fill="none" stroke="#d9f9fb" stroke-opacity=".25" stroke-width="7"/></svg>'''
stoneoff='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><radialGradient id="s" cx="34%" cy="28%"><stop stop-color="#8f9695"/><stop offset=".4" stop-color="#646968"/><stop offset="1" stop-color="#2d302f"/></radialGradient></defs><path d="M33 132C31 73 70 30 128 28c62-2 102 44 96 105-5 58-43 98-101 96-55-2-88-42-90-97z" fill="url(#s)" stroke="#4c504e" stroke-width="7"/><path d="M87 48l27 68-30 35 43 76M164 39l-17 65 26 27-20 87" fill="none" stroke="#232625" stroke-width="8" opacity=".8"/></svg>'''
write('assets/counters/spirit-on.svg',stone); write('assets/counters/spirit-off.svg',stoneoff)
ember='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><radialGradient id="a" cx="42%" cy="35%"><stop stop-color="#fff0a8"/><stop offset=".25" stop-color="#e0a33f"/><stop offset=".62" stop-color="#9d5724"/><stop offset="1" stop-color="#4b2419"/></radialGradient><filter id="g"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M128 23l65 38 31 66-24 74-72 34-72-34-24-74 31-66z" fill="url(#a)" stroke="#e4ae4f" stroke-width="7" filter="url(#g)"/><path d="M77 76l48-24 47 21-29 24-42-1z" fill="#fff4b7" opacity=".35"/><path d="M70 147l51 55 62-63" fill="none" stroke="#ffd26d" stroke-width="8" opacity=".32"/></svg>'''
emberoff='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><radialGradient id="a" cx="42%" cy="35%"><stop stop-color="#81766b"/><stop offset=".5" stop-color="#574b43"/><stop offset="1" stop-color="#282321"/></radialGradient></defs><path d="M128 23l65 38 31 66-24 74-72 34-72-34-24-74 31-66z" fill="url(#a)" stroke="#493d36" stroke-width="7"/><path d="M70 64l59 63-37 31 42 70M184 67l-42 58 42 37" fill="none" stroke="#292321" stroke-width="9"/></svg>'''
write('assets/counters/determination-on.svg',ember); write('assets/counters/determination-off.svg',emberoff)

# Logo
logo=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 460">{defs()}<g transform="translate(700 200)"><circle r="145" fill="none" stroke="#b8924c" stroke-width="3" opacity=".8"/><path d="M0-132c-48 37-68 92-40 142 12 22 26 35 40 49 14-14 28-27 40-49 28-50 8-105-40-142z" fill="none" stroke="#c6a867" stroke-width="6"/><path d="M-112 64C-63 28-31 5 0-46 31 5 63 28 112 64" fill="none" stroke="#c6a867" stroke-width="4"/></g><text x="700" y="405" text-anchor="middle" font-family="Georgia,serif" font-size="108" letter-spacing="15" fill="#e4d8bf">CUENTOS DE ÁNIMAS</text><text x="700" y="448" text-anchor="middle" font-family="Georgia,serif" font-size="24" letter-spacing="9" fill="#b8924c">MR · FOUNDRY VTT</text></svg>'''
write('assets/branding/logo.svg',logo)

# Table overhead illustration
write('assets/branding/table.svg',f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">{defs()}<rect width="1920" height="1080" fill="#130f0c"/><rect x="30" y="30" width="1860" height="1020" rx="70" fill="#2b1b13"/><path d="M0 110C480 45 960 80 1920 30M0 286C620 205 1170 298 1920 185M0 620C530 520 1200 650 1920 510M0 920C640 830 1180 930 1920 810" fill="none" stroke="#5e3c26" stroke-width="11" opacity=".23"/><ellipse cx="960" cy="550" rx="700" ry="425" fill="#14110f" opacity=".7"/><ellipse cx="960" cy="550" rx="670" ry="395" fill="none" stroke="#a68144" stroke-opacity=".16" stroke-width="4"/><g opacity=".25"><circle cx="260" cy="215" r="95" fill="#d9a54b"/><circle cx="1660" cy="215" r="95" fill="#d9a54b"/></g><g fill="#70513a" opacity=".65"><path d="M120 930c210-155 342-134 479-56-135 23-273 70-401 146z"/><path d="M1800 930c-210-155-342-134-479-56 135 23 273 70 401 146z"/></g></svg>''')

# Scenario covers
for rel,title,sub,accent,shape in [
 ('scenario-voice.svg','LA VOZ QUE DEJASTE ATRÁS','Siete cintas. Una noche. Dos versiones.','#8b6c47','tape'),
 ('scenario-house.svg','LA CASA QUE RESPIRA','La casa conoce tu nombre antes que tú.','#5f6b5e','house')]:
    if shape=='tape':
        art='''<g transform="translate(600 465)" fill="none" stroke="#d7c8ad"><rect x="-245" y="-140" width="490" height="280" rx="28" stroke-width="7"/><circle cx="-112" cy="-12" r="64" stroke-width="7"/><circle cx="112" cy="-12" r="64" stroke-width="7"/><path d="M-48-12h96M-172 101h344l-35-64H-137z" stroke-width="6"/><path d="M-112-76c62 37 128 37 224 0" stroke-width="3" opacity=".4"/></g>'''
    else:
        art='''<g transform="translate(600 475)" fill="none" stroke="#d7c8ad" stroke-linejoin="round"><path d="M-260 60V-105L0-255 260-105V60" stroke-width="9"/><path d="M-220 60h440M-150 60v-205h105V60M55 60v-155h112V60" stroke-width="7"/><path d="M-270 80c77-34 144-28 212 4 59-38 123-39 189-5 53-25 101-25 150 0" stroke-width="4" opacity=".5"/></g>'''
    write('assets/branding/'+rel,f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600">{defs()}<rect width="1200" height="1600" fill="#15120f"/><rect x="42" y="42" width="1116" height="1516" rx="44" fill="#231c17" stroke="{accent}" stroke-width="5"/><circle cx="600" cy="490" r="370" fill="{accent}" opacity=".12"/>{art}<text x="600" y="1030" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="73" letter-spacing="5" fill="#e3d7c0">{title}</text><text x="600" y="1110" text-anchor="middle" font-family="Georgia,serif" font-size="31" font-style="italic" fill="#bba98c">{sub}</text><path d="M270 1200h660" stroke="{accent}" stroke-width="3"/><text x="600" y="1285" text-anchor="middle" font-family="Georgia,serif" font-size="30" letter-spacing="7" fill="#a98b5c">MR · CUENTOS DE ÁNIMAS</text></svg>''')

# Master cover
cover=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">{defs()}<rect width="1920" height="1080" fill="#0e0c0a"/><path d="M0 780C350 650 610 710 920 615c300-92 621-280 1000-210v675H0z" fill="#161913"/><g opacity=".55" stroke="#293027" stroke-width="19" fill="none"><path d="M95 720C150 435 177 273 145 70M148 357L40 243M157 289l136-146M344 740c-11-281-6-486 66-680M398 337L285 189M410 260l133-155M1660 685c-34-297-40-461-5-613M1650 348l-147-155M1661 251l122-133M1441 721c25-286 12-465-44-642M1419 350l-121-111M1427 267l128-142"/></g><ellipse cx="960" cy="1010" rx="700" ry="210" fill="#302218" opacity=".9"/><g transform="translate(960 500)"><circle r="220" fill="#151516" stroke="#9a7841" stroke-width="3"/><path d="M0-180c-77 55-113 144-91 232 10 40-6 89-45 147h272c-39-58-55-107-45-147 22-88-14-177-91-232z" fill="#44484a" opacity=".88"/><path d="M0-134c-51 42-70 100-53 155 8 24 20 43 53 77 33-34 45-53 53-77 17-55-2-113-53-155z" fill="#c1c4c4" opacity=".12"/></g><text x="960" y="830" text-anchor="middle" font-family="Georgia,serif" font-size="112" letter-spacing="14" fill="#e5dac6">CUENTOS DE ÁNIMAS</text><text x="960" y="895" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="34" fill="#b79b69">Relatos que aguardan cuando cae la noche</text><text x="960" y="1004" text-anchor="middle" font-family="Georgia,serif" font-size="24" letter-spacing="8" fill="#8f764a">MR · FOUNDRY VTT · V13 / V14</text></svg>'''
write('assets/branding/cover.svg',cover)
print('assets written')
