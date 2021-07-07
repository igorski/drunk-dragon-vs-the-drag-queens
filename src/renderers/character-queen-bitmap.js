import { loader } from 'zcanvas';
import { createPixelCanvas, changeImageColor } from '@/utils/canvas-util';
import {
    ASSET_PATH, CHARACTER_SIZE, BODY_SIZE, BODY_PARTS, fileSuffix
} from '@/definitions/character-queen';

export const TARGET_SIZE = 200;

export const generateBitmap = async queenToRender => {
    const scale = TARGET_SIZE / CHARACTER_SIZE.width;
    const { appearance } = queenToRender;

    const bodySvg = { src: `${ASSET_PATH}body.svg` };
    const shadows = { src: `${ASSET_PATH}shadows.png` };
    const nose    = { src: `${ASSET_PATH}nose_${fileSuffix(appearance.nose)}.png` };
    const eyes    = { src: `${ASSET_PATH}eyes_${fileSuffix(appearance.eyes)}.png` };
    const hair    = { src: `${ASSET_PATH}hair_${fileSuffix(appearance.hair)}.png` };
    const mouth   = { src: `${ASSET_PATH}mouth_${fileSuffix(appearance.mouth)}.png` };
    const clothes = { src: `${ASSET_PATH}clothes_${fileSuffix(appearance.clothes)}.png` };
    const jewelry = { src: `${ASSET_PATH}jewelry_${fileSuffix(appearance.jewelry)}.png` };

    const imagesToLoad = [ bodySvg, shadows, nose, eyes, hair, mouth, clothes, jewelry ];

    for ( let i = 0; i < imagesToLoad.length; ++i ) {
        const itl = imagesToLoad[ i ];
        itl.img = new Image();

        await loader.loadImage( itl.src, itl.img );
    }

    const { cvs, ctx } = createPixelCanvas( TARGET_SIZE, CHARACTER_SIZE.height * scale );

    // body is SVG and requires custom coloring

    bodySvg.img = changeImageColor( bodySvg.img, appearance.skin );

    // render base body parts

    renderBodyPart( ctx, bodySvg, scale, BODY_SIZE );
    renderBodyPart( ctx, shadows, scale, BODY_PARTS.shadows );
    renderBodyPart( ctx, clothes, scale, BODY_PARTS.clothes );

    // apply circular mask to body and clothes

    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(
        cvs.width * .5,
        cvs.height * .5,
        cvs.width * .5,
        0, 2 * Math.PI
    );
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // overlay remaining body parts

    renderBodyPart( ctx, nose,    scale, BODY_PARTS.nose );
    renderBodyPart( ctx, eyes,    scale, BODY_PARTS.eyes );
    renderBodyPart( ctx, hair,    scale, BODY_PARTS.hair );
    renderBodyPart( ctx, mouth,   scale, BODY_PARTS.mouth );
    renderBodyPart( ctx, jewelry, scale, BODY_PARTS.jewelry );

    const out = new Image();
    out.src   = cvs.toDataURL();

    return out;
};

function renderBodyPart( ctx, { img }, scale, { top, left, width, height }) {
    ctx.drawImage( img, left * scale, top * scale, width * scale, height * scale );
}
